import messagesService from "../modules/messages/messages.service.js";
import usersRepository from "../modules/users/users.repository.js";
import logger from "../utils/logger.js";
import { markOnline, markOffline } from "./presence.js";

export function registerChatHandlers(io, socket) {
  const { id: userId, username } = socket.user;

  socket.join(`user:${userId}`);
  markOnline(userId, socket.id);
  io.emit("presence:update", { userId, online: true });

  socket.on("message:send", async ({ receiverId, body }, ack) => {
    try {
      const message = await messagesService.sendMessage({
        senderId: userId,
        receiverId,
        body,
      });
      io.to(`user:${receiverId}`).to(`user:${userId}`).emit("message:new", message);
      ack?.({ message });
    } catch (err) {
      // AppError messages are safe to surface to the client; anything else is not.
      ack?.({ error: err.isOperational ? err.message : "Could not send message" });
      if (!err.isOperational) logger.error("message:send error:", err);
    }
  });

  socket.on("message:typing", ({ receiverId, isTyping }) => {
    if (!Number.isInteger(receiverId)) return;
    io.to(`user:${receiverId}`).emit("message:typing", {
      userId,
      username,
      isTyping: !!isTyping,
    });
  });

  socket.on("message:read", async ({ senderId }) => {
    if (!Number.isInteger(senderId)) return;
    try {
      await messagesService.markConversationRead({ senderId, receiverId: userId });
      io.to(`user:${senderId}`).emit("message:read", { by: userId });
    } catch (err) {
      logger.error("message:read error:", err);
    }
  });

  socket.on("disconnect", async () => {
    const fullyOffline = markOffline(userId, socket.id);
    if (fullyOffline) {
      try {
        await usersRepository.touchLastSeen(userId);
      } catch (err) {
        logger.error("Error updating last_seen_at on disconnect:", err);
      }
      io.emit("presence:update", { userId, online: false });
    }
  });
}

export default registerChatHandlers;
