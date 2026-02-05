import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { query } from "./db.js";
import { sendPatientConfirmation, sendStaffNotification, canSendEmail } from "./email.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "appointments-api" });
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
      "select start_time from appointments where start_time >= $1 and start_time < $2",
      [startDate.toISOString(), endDateExclusive.toISOString()]
    );

    const bookedStarts = new Set(
      appointmentsResult.rows.map((row) => new Date(row.start_time).getTime())
    );

    const slots = [];
    const today = new Date();

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

          if (slotStart.getTime() < today.getTime()) {
            continue;
          }

          if (bookedStarts.has(slotStart.getTime())) {
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

const minutesBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 60000);

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
    if (error?.code === "23505") {
      return res.status(409).json({ message: "This time slot is already booked." });
    }
    console.error(error);
    res.status(500).json({ message: "Failed to create appointment." });
  }
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
