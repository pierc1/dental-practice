import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const resolveConnectionString = () => {
  if (process.env.NODE_ENV === "test") {
    return process.env.DATABASE_URL;
  }
  return process.env.DATABASE_URL_RUNTIME || process.env.DATABASE_URL;
};

const connectionString = resolveConnectionString();

const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes("localhost") ? false : { rejectUnauthorized: false },
});

export const query = (text, params) => pool.query(text, params);
export default pool;
