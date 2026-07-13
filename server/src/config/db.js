import pg from "pg";
import config from "./env.js";
import logger from "../utils/logger.js";

const { Pool } = pg;

export const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: config.db.maxPoolSize,
});

pool.on("error", (err) => {
  // Errors on idle clients (e.g. connection dropped) — log, don't crash.
  logger.error("Unexpected PostgreSQL pool error", err);
});

export async function checkDbConnection() {
  await pool.query("SELECT 1");
}

export default pool;
