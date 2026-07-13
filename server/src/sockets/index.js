import { Server } from "socket.io";
import socketServerOptions from "../config/socket.js";
import socketAuth from "./socket.auth.js";
import registerChatHandlers from "./chat.handlers.js";
import logger from "../utils/logger.js";

export function initSocketServer(httpServer) {
  const io = new Server(httpServer, socketServerOptions);

  io.use(socketAuth);

  io.on("connection", (socket) => {
    logger.debug(`Socket connected: user ${socket.user.id} (${socket.id})`);
    registerChatHandlers(io, socket);
  });

  return io;
}

export default initSocketServer;
