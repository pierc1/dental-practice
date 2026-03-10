/** @vitest-environment node */

import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "1";
const describeDb = shouldRunDbTests ? describe : describe.skip;

describeDb("DB: schema invariants", () => {
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

  it("has unique indexes for appointment types and availability slot tuples", async () => {
    const result = await queryFn(
      `select indexname
       from pg_indexes
       where schemaname = 'public'
         and indexname in (
           'appointment_types_name_unique_idx',
           'availability_unique_slot_idx',
           'admin_users_username_key'
         )`
    );

    const names = new Set(result.rows.map((row) => row.indexname));

    expect(names.has("appointment_types_name_unique_idx")).toBe(true);
    expect(names.has("availability_unique_slot_idx")).toBe(true);
    expect(names.has("admin_users_username_key")).toBe(true);
  });

  it("has team member active/display order index", async () => {
    const result = await queryFn(
      `select indexname
       from pg_indexes
       where schemaname = 'public'
         and indexname = 'team_members_active_order_idx'`
    );

    expect(result.rows).toHaveLength(1);
  });

  it("has overlap exclusion constraints for appointments and blocked periods", async () => {
    const result = await queryFn(
      `select conname, pg_get_constraintdef(oid) as definition
       from pg_constraint
       where conname in ('appointments_no_overlap', 'blocked_periods_no_overlap')`
    );

    const constraints = Object.fromEntries(
      result.rows.map((row) => [row.conname, row.definition])
    );

    expect(constraints.appointments_no_overlap).toMatch(/exclude/i);
    expect(constraints.appointments_no_overlap).toMatch(/tstzrange/i);

    expect(constraints.blocked_periods_no_overlap).toMatch(/exclude/i);
    expect(constraints.blocked_periods_no_overlap).toMatch(/tstzrange/i);
  });
});
