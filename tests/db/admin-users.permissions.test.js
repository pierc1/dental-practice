/** @vitest-environment node */

import "dotenv/config";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const shouldRunPermissionTests = process.env.RUN_DB_PERMISSION_TESTS === "1";
const describeDb = shouldRunPermissionTests ? describe : describe.skip;

const { Pool } = pg;

const TEST_HASH = "$2b$12$zRE8/e4SibmJ7aBKeSS26.5Vi7J../iKt.RP0fSyZpEq38MIGlh.G";

describeDb("DB: admin_users runtime permissions", () => {
  let runtimePool;

  beforeAll(async () => {
    if (!process.env.DATABASE_URL_RUNTIME) {
      throw new Error("DATABASE_URL_RUNTIME is required when RUN_DB_PERMISSION_TESTS=1.");
    }

    runtimePool = new Pool({
      connectionString: process.env.DATABASE_URL_RUNTIME,
      ssl: process.env.DATABASE_URL_RUNTIME.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  });

  afterAll(async () => {
    if (runtimePool) {
      await runtimePool.end();
    }
  });

  it("blocks insert into admin_users for runtime role", async () => {
    let insertError;
    try {
      await runtimePool.query(
        `insert into admin_users (username, password_hash, role, is_active)
         values ($1, $2, 'admin', true)`,
        [`runtime-test-${Date.now()}`, TEST_HASH]
      );
    } catch (error) {
      insertError = error;
    }

    expect(insertError).toBeTruthy();
    expect(insertError.code).toBe("42501");
  });

  it("blocks update and delete on admin_users for runtime role", async () => {
    let updateError;
    try {
      await runtimePool.query("update admin_users set is_active = is_active where username = 'admin1'");
    } catch (error) {
      updateError = error;
    }

    expect(updateError).toBeTruthy();
    expect(updateError.code).toBe("42501");

    let deleteError;
    try {
      await runtimePool.query("delete from admin_users where username = 'admin1'");
    } catch (error) {
      deleteError = error;
    }

    expect(deleteError).toBeTruthy();
    expect(deleteError.code).toBe("42501");
  });
});
