/** @vitest-environment node */

import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "1";
const describeDb = shouldRunDbTests ? describe : describe.skip;

const futureIso = (dayOffset, hour, minute) => {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

describeDb("DB: integrity constraints", () => {
  let queryFn;
  let pool;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when RUN_DB_TESTS=1.");
    }

    const db = await import("../../server/db.js");
    queryFn = db.query;
    pool = db.default;
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("rejects overlapping appointments at DB level", async () => {
    const appointmentTypeResult = await queryFn(
      "select id from appointment_types where is_active = true order by id asc limit 1"
    );
    const appointmentTypeId = appointmentTypeResult.rows[0]?.id;
    expect(appointmentTypeId).toBeTruthy();

    const firstStart = futureIso(40, 9, 0);
    const firstEnd = futureIso(40, 10, 0);
    const overlappingStart = futureIso(40, 9, 30);
    const overlappingEnd = futureIso(40, 10, 30);

    await queryFn("begin");

    try {
      await queryFn(
        `insert into appointments
          (appointment_type_id, start_time, end_time, first_name, last_name, contact_email, contact_phone, notes, status)
         values
          ($1, $2, $3, 'Test', 'One', 'one@example.com', '1111111111', 'first', 'booked')`,
        [appointmentTypeId, firstStart, firstEnd]
      );

      let overlapError;
      try {
        await queryFn(
          `insert into appointments
            (appointment_type_id, start_time, end_time, first_name, last_name, contact_email, contact_phone, notes, status)
           values
            ($1, $2, $3, 'Test', 'Two', 'two@example.com', '2222222222', 'second', 'booked')`,
          [appointmentTypeId, overlappingStart, overlappingEnd]
        );
      } catch (error) {
        overlapError = error;
      }

      expect(overlapError).toBeTruthy();
      expect(overlapError.code).toBe("23P01");
    } finally {
      await queryFn("rollback");
    }
  });

  it("rejects overlapping blocked periods at DB level", async () => {
    const firstStart = futureIso(41, 12, 0);
    const firstEnd = futureIso(41, 13, 0);
    const overlappingStart = futureIso(41, 12, 30);
    const overlappingEnd = futureIso(41, 13, 30);

    await queryFn("begin");

    try {
      await queryFn(
        `insert into blocked_periods (start_time, end_time, reason)
         values ($1, $2, 'first block')`,
        [firstStart, firstEnd]
      );

      let overlapError;
      try {
        await queryFn(
          `insert into blocked_periods (start_time, end_time, reason)
           values ($1, $2, 'overlap block')`,
          [overlappingStart, overlappingEnd]
        );
      } catch (error) {
        overlapError = error;
      }

      expect(overlapError).toBeTruthy();
      expect(overlapError.code).toBe("23P01");
    } finally {
      await queryFn("rollback");
    }
  });
});
