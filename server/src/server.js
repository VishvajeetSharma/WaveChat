import http from "http";
import config from "./config/env.js";
import { createApp } from "./app.js";
import { initSocketServer } from "./sockets/index.js";
import { checkDbConnection, pool } from "./config/db.js";
import logger from "./utils/logger.js";

async function main() {
  await checkDbConnection();
  logger.info("Database connection OK");

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(config.port, "0.0.0.0", () => {
    logger.info(`Server listening on http://localhost:${config.port} [${config.nodeEnv}]`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    httpServer.close(async () => {
      await pool.end();
      logger.info("Shutdown complete.");
      process.exit(0);
    });
    // Force-exit if something hangs
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err) => {
  logger.error("Fatal error during startup:", err);
  process.exit(1);
});
