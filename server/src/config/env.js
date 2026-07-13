import "dotenv/config";

function required(name, value) {
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || "development";

export const config = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  port: Number(process.env.PORT) || 4000,

  db: {
    host: process.env.PGHOST || "localhost",
    port: Number(process.env.PGPORT) || 5432,
    database: required("PGDATABASE", process.env.PGDATABASE),
    user: required("PGUSER", process.env.PGUSER),
    password: process.env.PGPASSWORD || "",
    maxPoolSize: Number(process.env.PG_POOL_MAX) || 10,
  },

  jwt: {
    secret: required("JWT_SECRET", process.env.JWT_SECRET),
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },

  clientOrigins: (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  rateLimit: {
    authWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    authMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  },
};

export default config;
