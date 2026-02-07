import crypto from "crypto";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";
import { sendPatientConfirmation, sendStaffNotification, canSendEmail } from "./email.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5050;

const parseAllowedOrigins = () => {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return ["http://localhost:5173", "http://127.0.0.1:5173"];
};

const allowedOrigins = new Set(parseAllowedOrigins());

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("CORS_NOT_ALLOWED"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.set("trust proxy", 1);

app.use((error, req, res, next) => {
  if (error?.message === "CORS_NOT_ALLOWED") {
    res.status(403).json({ message: "Origin not allowed by CORS." });
    return;
  }
  next(error);
});

const getClientIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
};

const cleanupExpiredEntries = (store, now) => {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now || value.expiresAt <= now) {
      store.delete(key);
    }
  }
};

const createRateLimiter = ({ windowMs, max, keyPrefix }) => {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    if (hits.size > 2000) {
      cleanupExpiredEntries(hits, now);
    }

    const key = `${keyPrefix}:${getClientIp(req)}`;
    const existing = hits.get(key);

    if (!existing || existing.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    existing.count += 1;

    if (existing.count > max) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((existing.resetAt - now) / 1000)
      );
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ message: "Too many requests. Please try again shortly." });
      return;
    }

    next();
  };
};

const adminRouteRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyPrefix: "admin-route",
});

const adminLoginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 12,
  keyPrefix: "admin-login",
});

const ADMIN_SESSION_COOKIE = "admin_session";
const adminSessionTtlMinutes = Number(process.env.ADMIN_SESSION_TTL_MINUTES) || 30;
const adminSessionTtlMs = adminSessionTtlMinutes * 60 * 1000;
const adminSessions = new Map();

const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: adminSessionTtlMs,
  path: "/api",
};

const parseCookies = (cookieHeader = "") => {
  if (!cookieHeader) return {};

  return cookieHeader.split(";").reduce((acc, cookieSegment) => {
    const separatorIndex = cookieSegment.indexOf("=");
    if (separatorIndex === -1) return acc;

    const key = cookieSegment.slice(0, separatorIndex).trim();
    const value = cookieSegment.slice(separatorIndex + 1).trim();

    if (!key) return acc;

    try {
      acc[key] = decodeURIComponent(value);
    } catch {
      acc[key] = value;
    }

    return acc;
  }, {});
};

const isAdminConfigured = () =>
  typeof process.env.ADMIN_PASSWORD === "string" &&
  process.env.ADMIN_PASSWORD.trim().length > 0;

const ensureAdminConfigured = (res) => {
  if (isAdminConfigured()) return true;
  res.status(500).json({ message: "Admin authentication is not configured." });
  return false;
};

const getAdminSessionToken = (req) => {
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[ADMIN_SESSION_COOKIE] || null;
};

const clearAdminSession = (res, token) => {
  if (token) {
    adminSessions.delete(token);
  }
  res.clearCookie(ADMIN_SESSION_COOKIE, {
    path: adminCookieOptions.path,
    sameSite: adminCookieOptions.sameSite,
    secure: adminCookieOptions.secure,
  });
};

const createAdminSession = (res) => {
  const token = crypto.randomBytes(32).toString("hex");
  adminSessions.set(token, { expiresAt: Date.now() + adminSessionTtlMs });
  res.cookie(ADMIN_SESSION_COOKIE, token, adminCookieOptions);
};

const requireAdminAuth = (req, res) => {
  if (!ensureAdminConfigured(res)) return false;

  const now = Date.now();
  if (adminSessions.size > 2000) {
    cleanupExpiredEntries(adminSessions, now);
  }

  const token = getAdminSessionToken(req);
  if (!token) {
    res.status(401).json({ message: "Unauthorized." });
    return false;
  }

  const session = adminSessions.get(token);
  if (!session || session.expiresAt <= now) {
    clearAdminSession(res, token);
    res.status(401).json({ message: "Unauthorized." });
    return false;
  }

  session.expiresAt = now + adminSessionTtlMs;
  return true;
};

const pad = (value) => String(value).padStart(2, "0");

const formatDateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseDateParam = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
};

const parseDateTimeValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const addDays = (date, days) => {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
};

const buildDateWithTime = (date, timeValue) => {
  const [hh, mm, ss] = String(timeValue).split(":");
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    Number(hh || 0),
    Number(mm || 0),
    Number(ss || 0),
    0
  );
};

const hasTimeRangeConflict = (rangeStart, rangeEnd, existingRanges) =>
  existingRanges.some(
    (range) => rangeStart < range.end && rangeEnd > range.start
  );

const minutesBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 60000);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "appointments-api" });
});

app.post("/api/admin/login", adminLoginRateLimiter, async (req, res) => {
  try {
    if (!ensureAdminConfigured(res)) return;

    const password = String(req.body?.password || "");
    const expectedPassword = String(process.env.ADMIN_PASSWORD || "");

    if (!password || password !== expectedPassword) {
      res.status(401).json({ message: "Invalid admin password." });
      return;
    }

    createAdminSession(res);
    res.json({ ok: true, sessionTtlMinutes: adminSessionTtlMinutes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to log in." });
  }
});

app.post("/api/admin/logout", adminRouteRateLimiter, (req, res) => {
  const token = getAdminSessionToken(req);
  clearAdminSession(res, token);
  res.status(204).send();
});

app.get("/api/admin/session", adminRouteRateLimiter, (req, res) => {
  if (!requireAdminAuth(req, res)) return;
  res.json({ authenticated: true, sessionTtlMinutes: adminSessionTtlMinutes });
});

app.get("/api/services", async (req, res) => {
  try {
    const result = await query(
      "select id, name, duration_minutes from services where is_active = true order by name"
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load services." });
  }
});

app.get("/api/appointments", adminRouteRateLimiter, async (req, res) => {
  try {
    if (!requireAdminAuth(req, res)) return;

    const { q, start, end, status, serviceId, limit } = req.query;
    const filters = [];
    const values = [];

    const startDate = parseDateParam(start);
    const endDate = parseDateParam(end);

    if (startDate) {
      values.push(startDate.toISOString());
      filters.push(`a.start_time >= $${values.length}`);
    }

    if (endDate) {
      const endExclusive = addDays(endDate, 1);
      values.push(endExclusive.toISOString());
      filters.push(`a.start_time < $${values.length}`);
    }

    if (status && status !== "all") {
      values.push(status);
      filters.push(`a.status = $${values.length}`);
    }

    if (serviceId) {
      values.push(serviceId);
      filters.push(`a.service_id = $${values.length}`);
    }

    if (q) {
      values.push(`%${q}%`);
      filters.push(
        `(a.first_name ilike $${values.length}
          or a.last_initial ilike $${values.length}
          or a.contact_email ilike $${values.length}
          or a.contact_phone ilike $${values.length})`
      );
    }

    const whereClause = filters.length ? `where ${filters.join(" and ")}` : "";
    const safeLimit = Math.min(Number(limit) || 200, 500);
    values.push(safeLimit);

    const result = await query(
      `select
          a.id,
          a.start_time,
          a.end_time,
          a.first_name,
          a.last_initial as last_name,
          a.contact_email,
          a.contact_phone,
          a.notes,
          a.status,
          a.created_at,
          s.name as service_name
        from appointments a
        left join services s on a.service_id = s.id
        ${whereClause}
        order by a.start_time desc
        limit $${values.length}`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load appointments." });
  }
});

app.get("/api/blocked-periods", adminRouteRateLimiter, async (req, res) => {
  try {
    if (!requireAdminAuth(req, res)) return;

    const { start, end, limit } = req.query;
    const filters = [];
    const values = [];

    const startDate = parseDateParam(start);
    const endDate = parseDateParam(end);

    if (startDate) {
      values.push(startDate.toISOString());
      filters.push(`start_time >= $${values.length}`);
    }

    if (endDate) {
      const endExclusive = addDays(endDate, 1);
      values.push(endExclusive.toISOString());
      filters.push(`start_time < $${values.length}`);
    }

    const whereClause = filters.length ? `where ${filters.join(" and ")}` : "";
    const safeLimit = Math.min(Number(limit) || 200, 500);
    values.push(safeLimit);

    const result = await query(
      `select id, start_time, end_time, reason, created_at
       from blocked_periods
       ${whereClause}
       order by start_time asc
       limit $${values.length}`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load blocked periods." });
  }
});

app.post("/api/blocked-periods", adminRouteRateLimiter, async (req, res) => {
  try {
    if (!requireAdminAuth(req, res)) return;

    const { startTime, endTime, reason } = req.body || {};
    const blockStart = parseDateTimeValue(startTime);
    const blockEnd = parseDateTimeValue(endTime);

    if (!blockStart || !blockEnd) {
      return res.status(400).json({ message: "Valid startTime and endTime are required." });
    }

    if (blockEnd <= blockStart) {
      return res.status(400).json({ message: "endTime must be after startTime." });
    }

    const appointmentConflictResult = await query(
      `select id
       from appointments
       where status <> 'cancelled'
         and start_time < $2
         and end_time > $1
       limit 1`,
      [blockStart.toISOString(), blockEnd.toISOString()]
    );

    if (appointmentConflictResult.rowCount > 0) {
      return res.status(409).json({
        message: "Cannot block this time range because an appointment already exists.",
      });
    }

    const blockConflictResult = await query(
      `select id
       from blocked_periods
       where start_time < $2
         and end_time > $1
       limit 1`,
      [blockStart.toISOString(), blockEnd.toISOString()]
    );

    if (blockConflictResult.rowCount > 0) {
      return res.status(409).json({ message: "This time range is already blocked." });
    }

    const insertResult = await query(
      `insert into blocked_periods (start_time, end_time, reason)
       values ($1, $2, $3)
       returning id, start_time, end_time, reason, created_at`,
      [blockStart.toISOString(), blockEnd.toISOString(), reason?.trim() || null]
    );

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    if (error?.code === "23P01") {
      return res.status(409).json({ message: "This time range is already blocked." });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create blocked period." });
  }
});

app.delete("/api/blocked-periods/:id", adminRouteRateLimiter, async (req, res) => {
  try {
    if (!requireAdminAuth(req, res)) return;

    const deleteResult = await query(
      "delete from blocked_periods where id = $1 returning id",
      [req.params.id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({ message: "Blocked period not found." });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete blocked period." });
  }
});

app.get("/api/availability", async (req, res) => {
  try {
    const startParam = parseDateParam(req.query.start);
    const endParam = parseDateParam(req.query.end);
    const serviceIdParam = req.query.serviceId;

    const startDate = startParam || new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = endParam || addDays(startDate, 6);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
      return res.status(400).json({ message: "End date must be after start date." });
    }

    let serviceDurationMinutes = null;
    if (serviceIdParam) {
      const serviceResult = await query(
        "select duration_minutes from services where id = $1 and is_active = true",
        [serviceIdParam]
      );
      if (serviceResult.rowCount === 0) {
        return res.status(400).json({ message: "Invalid serviceId." });
      }
      serviceDurationMinutes = Number(serviceResult.rows[0].duration_minutes);
    }

    const availabilityResult = await query(
      "select day_of_week, start_time, end_time, slot_length_minutes from availability order by day_of_week, start_time"
    );
    const availabilityRows = availabilityResult.rows;

    const exceptionsResult = await query(
      "select exception_date, is_closed, start_time, end_time from exceptions where exception_date between $1 and $2",
      [formatDateKey(startDate), formatDateKey(endDate)]
    );

    const exceptionsByDate = new Map(
      exceptionsResult.rows.map((row) => [
        row.exception_date instanceof Date
          ? formatDateKey(row.exception_date)
          : String(row.exception_date),
        row,
      ])
    );

    const endDateExclusive = addDays(endDate, 1);
    const appointmentsResult = await query(
      `select start_time, end_time
       from appointments
       where status <> 'cancelled'
         and start_time < $2
         and end_time > $1`,
      [startDate.toISOString(), endDateExclusive.toISOString()]
    );

    const blockedPeriodsResult = await query(
      `select start_time, end_time
       from blocked_periods
       where start_time < $2
         and end_time > $1`,
      [startDate.toISOString(), endDateExclusive.toISOString()]
    );

    const unavailableRanges = [
      ...appointmentsResult.rows,
      ...blockedPeriodsResult.rows,
    ].map((row) => ({
      start: new Date(row.start_time),
      end: new Date(row.end_time),
    }));

    const slots = [];
    const now = new Date();

    for (
      let cursor = new Date(startDate.getTime());
      cursor <= endDate;
      cursor = addDays(cursor, 1)
    ) {
      const dateKey = formatDateKey(cursor);
      const exception = exceptionsByDate.get(dateKey);

      if (exception?.is_closed) {
        continue;
      }

      const dayOfWeek = cursor.getDay();
      const dayAvailability = availabilityRows.filter(
        (row) => Number(row.day_of_week) === dayOfWeek
      );

      let windows = [];
      if (exception && !exception.is_closed) {
        const slotLength =
          dayAvailability[0]?.slot_length_minutes ??
          (Number(process.env.DEFAULT_SLOT_MINUTES) || 30);
        windows = [
          {
            start: exception.start_time,
            end: exception.end_time,
            slotLength,
          },
        ];
      } else {
        windows = dayAvailability.map((row) => ({
          start: row.start_time,
          end: row.end_time,
          slotLength: Number(row.slot_length_minutes),
        }));
      }

      for (const window of windows) {
        const windowStart = buildDateWithTime(cursor, window.start);
        const windowEnd = buildDateWithTime(cursor, window.end);
        const slotDuration = serviceDurationMinutes || window.slotLength;

        for (
          let slotStart = new Date(windowStart.getTime());
          slotStart < windowEnd;
          slotStart = new Date(slotStart.getTime() + window.slotLength * 60000)
        ) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
          if (slotEnd > windowEnd) break;

          if (slotStart.getTime() < now.getTime()) {
            continue;
          }

          if (hasTimeRangeConflict(slotStart, slotEnd, unavailableRanges)) {
            continue;
          }

          slots.push({
            date: dateKey,
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            time: `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())}`,
            durationMinutes: window.slotLength,
          });
        }
      }
    }

    res.json({
      start: formatDateKey(startDate),
      end: formatDateKey(endDate),
      slots,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to generate availability." });
  }
});

app.post("/api/appointments", async (req, res) => {
  try {
    const {
      serviceId,
      startTime,
      firstName,
      lastName,
      contactEmail,
      contactPhone,
      notes,
    } = req.body || {};

    if (!serviceId || !startTime || !firstName || !lastName) {
      return res.status(400).json({
        message: "serviceId, startTime, firstName, and lastName are required.",
      });
    }

    if (!contactEmail || !contactPhone) {
      return res.status(400).json({
        message: "Both contactEmail and contactPhone are required.",
      });
    }

    if (!notes) {
      return res.status(400).json({
        message: "notes are required.",
      });
    }

    const requestedStart = new Date(startTime);
    if (Number.isNaN(requestedStart.getTime())) {
      return res.status(400).json({ message: "Invalid startTime." });
    }

    const now = new Date();
    if (requestedStart < now) {
      return res.status(400).json({ message: "Start time must be in the future." });
    }

    const serviceResult = await query(
      "select id, name, duration_minutes from services where id = $1 and is_active = true",
      [serviceId]
    );

    if (serviceResult.rowCount === 0) {
      return res.status(400).json({ message: "Invalid serviceId." });
    }

    const serviceName = serviceResult.rows[0].name;
    const durationMinutes = Number(serviceResult.rows[0].duration_minutes);
    const requestedEnd = new Date(requestedStart.getTime() + durationMinutes * 60000);

    const dateKey = formatDateKey(requestedStart);
    const exceptionResult = await query(
      "select exception_date, is_closed, start_time, end_time from exceptions where exception_date = $1",
      [dateKey]
    );
    const exception = exceptionResult.rows[0];

    if (exception?.is_closed) {
      return res.status(400).json({ message: "Selected date is unavailable." });
    }

    const dayOfWeek = requestedStart.getDay();
    const availabilityResult = await query(
      "select start_time, end_time, slot_length_minutes from availability where day_of_week = $1 order by start_time",
      [dayOfWeek]
    );

    const availabilityRows = availabilityResult.rows;
    const hasAvailability =
      availabilityRows.length > 0 || (exception && !exception.is_closed);

    if (!hasAvailability) {
      return res.status(400).json({ message: "No availability for this day." });
    }

    const windowSlotLength =
      availabilityRows[0]?.slot_length_minutes ??
      (Number(process.env.DEFAULT_SLOT_MINUTES) || 30);

    const windows = exception && !exception.is_closed
      ? [
          {
            start: exception.start_time,
            end: exception.end_time,
            slotLength: windowSlotLength,
          },
        ]
      : availabilityRows.map((row) => ({
          start: row.start_time,
          end: row.end_time,
          slotLength: Number(row.slot_length_minutes),
        }));

    const isWithinWindow = windows.some((window) => {
      const windowStart = buildDateWithTime(requestedStart, window.start);
      const windowEnd = buildDateWithTime(requestedStart, window.end);

      if (requestedStart < windowStart || requestedEnd > windowEnd) return false;

      const offsetMinutes = minutesBetween(windowStart, requestedStart);
      return offsetMinutes % window.slotLength === 0;
    });

    if (!isWithinWindow) {
      return res.status(400).json({ message: "Selected time is not available." });
    }

    const overlappingAppointmentResult = await query(
      `select id
       from appointments
       where status <> 'cancelled'
         and start_time < $2
         and end_time > $1
       limit 1`,
      [requestedStart.toISOString(), requestedEnd.toISOString()]
    );

    if (overlappingAppointmentResult.rowCount > 0) {
      return res.status(409).json({ message: "This time slot is already booked." });
    }

    const blockedPeriodConflictResult = await query(
      `select id
       from blocked_periods
       where start_time < $2
         and end_time > $1
       limit 1`,
      [requestedStart.toISOString(), requestedEnd.toISOString()]
    );

    if (blockedPeriodConflictResult.rowCount > 0) {
      return res.status(409).json({ message: "This time range is blocked by the admin." });
    }

    const insertResult = await query(
      `insert into appointments
        (service_id, start_time, end_time, first_name, last_initial, contact_email, contact_phone, notes)
       values
        ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, start_time, end_time`,
      [
        serviceId,
        requestedStart.toISOString(),
        requestedEnd.toISOString(),
        firstName,
        lastName || null,
        contactEmail || null,
        contactPhone || null,
        notes || null,
      ]
    );

    const appointmentPayload = {
      serviceName,
      startTime: insertResult.rows[0].start_time,
      firstName,
      lastName,
      contactPhone,
    };

    let emailStatus = null;
    if (canSendEmail()) {
      try {
        const [staffResult, patientResult] = await Promise.allSettled([
          sendStaffNotification(appointmentPayload),
          sendPatientConfirmation({
            ...appointmentPayload,
            patientEmail: contactEmail,
          }),
        ]);
        emailStatus = { staff: staffResult.status, patient: patientResult.status };
      } catch (emailError) {
        console.error("Email send failed:", emailError);
        emailStatus = { error: true };
      }
    }

    res.status(201).json({
      id: insertResult.rows[0].id,
      startTime: insertResult.rows[0].start_time,
      endTime: insertResult.rows[0].end_time,
      emailStatus,
    });
  } catch (error) {
    if (error?.code === "23505" || error?.code === "23P01") {
      return res.status(409).json({ message: "This time slot is already booked." });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create appointment." });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
