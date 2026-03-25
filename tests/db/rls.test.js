/** @vitest-environment node */

import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "1";
const describeDb = shouldRunDbTests ? describe : describe.skip;

describeDb("DB: RLS hardening", () => {
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

  it("enables RLS on public tables", async () => {
    const tableNames = [
      "appointment_types",
      "admin_users",
      "availability",
      "exceptions",
      "appointments",
      "blocked_periods",
    ];

    const result = await queryFn(
      `select c.relname as table_name, c.relrowsecurity as rls_enabled
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public'
         and c.relname = any($1::text[])`,
      [tableNames]
    );

    const rlsByTable = Object.fromEntries(
      result.rows.map((row) => [row.table_name, row.rls_enabled])
    );

    for (const tableName of tableNames) {
      expect(rlsByTable[tableName]).toBe(true);
    }
  });
});
