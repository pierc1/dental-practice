/** @vitest-environment node */

import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shouldRunDbTests = process.env.RUN_DB_TESTS === "1";
const describeDb = shouldRunDbTests ? describe : describe.skip;

describeDb("DB: seed idempotency", () => {
  let queryFn;
  let pool;
  let seedSql;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required when RUN_DB_TESTS=1.");
    }

    const db = await import("../../server/db.js");
    queryFn = db.query;
    pool = db.default;

    const seedFilePath = path.resolve(process.cwd(), "server/seed.sql");
    seedSql = await readFile(seedFilePath, "utf8");
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it("can run seed twice without duplicating appointment types", async () => {
    await queryFn(seedSql);
    await queryFn(seedSql);

    const duplicateResult = await queryFn(
      `select name, count(*)::int as count
       from appointment_types
       group by name
       having count(*) > 1`
    );

    expect(duplicateResult.rows).toEqual([]);
  });

  it("can run seed twice without duplicating recurring availability windows", async () => {
    await queryFn(seedSql);
    await queryFn(seedSql);

    const duplicateResult = await queryFn(
      `select day_of_week, start_time, end_time, slot_length_minutes, count(*)::int as count
       from availability
       group by day_of_week, start_time, end_time, slot_length_minutes
       having count(*) > 1`
    );

    expect(duplicateResult.rows).toEqual([]);
  });

  it("can run seed twice without duplicating team member ids", async () => {
    await queryFn(seedSql);
    await queryFn(seedSql);

    const duplicateResult = await queryFn(
      `select id, count(*)::int as count
       from team_members
       group by id
       having count(*) > 1`
    );

    expect(duplicateResult.rows).toEqual([]);
  });
});
