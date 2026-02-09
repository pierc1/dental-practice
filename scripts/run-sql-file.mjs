import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

const getSslConfig = (connectionString) => {
  if (!connectionString) return false;

  try {
    const parsed = new URL(connectionString);
    if (LOCAL_HOSTS.has(parsed.hostname)) return false;
    return { rejectUnauthorized: false };
  } catch {
    if (connectionString.includes("localhost") || connectionString.includes("127.0.0.1")) {
      return false;
    }
    return { rejectUnauthorized: false };
  }
};

const run = async () => {
  const sqlFileArg = process.argv[2];
  if (!sqlFileArg) {
    throw new Error("Missing SQL file path. Usage: node scripts/run-sql-file.mjs <path-to-sql>");
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to your .env file.");
  }

  const sqlFilePath = path.resolve(process.cwd(), sqlFileArg);
  const sqlText = await fs.readFile(sqlFilePath, "utf8");

  const client = new pg.Client({
    connectionString,
    ssl: getSslConfig(connectionString),
  });

  await client.connect();

  try {
    await client.query(sqlText);
    console.log(`Applied SQL: ${sqlFileArg}`);
  } finally {
    await client.end();
  }
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
