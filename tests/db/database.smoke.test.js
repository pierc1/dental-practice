/** @vitest-environment node */

import "dotenv/config";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shouldRunDbSmoke = process.env.RUN_DB_TESTS === "1";
const describeDb = shouldRunDbSmoke ? describe : describe.skip;

describeDb("DB smoke test", () => {
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

  it("connects and can query core tables", async () => {
    const ping = await queryFn("select 1 as ok");
    expect(Number(ping.rows[0].ok)).toBe(1);

    const tables = await queryFn(`
      select
        to_regclass('public.services') as services,
        to_regclass('public.availability') as availability,
        to_regclass('public.appointments') as appointments,
        to_regclass('public.blocked_periods') as blocked_periods
    `);

    expect(tables.rows[0].services).toBeTruthy();
    expect(tables.rows[0].availability).toBeTruthy();
    expect(tables.rows[0].appointments).toBeTruthy();
    expect(tables.rows[0].blocked_periods).toBeTruthy();
  });

  it("finds at least one active service row", async () => {
    const result = await queryFn(
      "select count(*)::int as total from services where is_active = true"
    );

    expect(result.rows[0].total).toBeGreaterThan(0);
  });
});
