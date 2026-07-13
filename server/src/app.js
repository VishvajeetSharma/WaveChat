import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import config from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import messagesRoutes from "./modules/messages/messages.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigins, credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(morgan(config.isProduction ? "combined" : "dev"));

  app.get("/api/health", (req, res) => res.json({ ok: true, env: config.nodeEnv }));

  app.use("/api/auth", authRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/messages", messagesRoutes);

  app.use("/api", notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
