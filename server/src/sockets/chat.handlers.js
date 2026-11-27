import messagesService from "../modules/messages/messages.service.js";
import usersRepository from "../modules/users/users.repository.js";
import logger from "../utils/logger.js";
import { markOnline, markOffline, isOnline, getOnlineUserIds } from "./presence.js";

/**
 * Message receipt events (WhatsApp-style ticks)
 *
 *   message:new       -> { ...message, clientId? }  delivered_at is already set
 *                        when the receiver was online at send time.
 *   message:delivered -> { by, ids, deliveredAt }   receiver came online and
 *                        picked up messages that were waiting for them.
 *   message:read      -> { by, ids, readAt }        receiver opened the chat.
 */

/** Tell every sender that their pending messages to `userId` were delivered. */
async function flushPendingDeliveries(io, userId) {
  const delivered = await messagesService.markAllDeliveredTo(userId);
  if (delivered.length === 0) return;

  const bySender = new Map(); // senderId -> { ids: number[], deliveredAt }
  for (const row of delivered) {
    if (!bySender.has(row.sender_id)) {
      bySender.set(row.sender_id, { ids: [], deliveredAt: row.delivered_at });
    }
    bySender.get(row.sender_id).ids.push(row.id);
  }

  for (const [senderId, { ids, deliveredAt }] of bySender) {
    io.to(`user:${senderId}`).emit("message:delivered", { by: userId, ids, deliveredAt });
  }
}

export function registerChatHandlers(io, socket) {
  const { id: userId, username } = socket.user;

  socket.join(`user:${userId}`);
  markOnline(userId, socket.id);
  socket.emit("presence:snapshot", { userIds: getOnlineUserIds() });
  io.emit("presence:update", { userId, online: true });

  // Messages sent while this user was offline are delivered now.
  flushPendingDeliveries(io, userId).catch((err) =>
    logger.error("flushPendingDeliveries error:", err)
  );

  socket.on("presence:get", () => {
    socket.emit("presence:snapshot", { userIds: getOnlineUserIds() });
  });

  socket.on("message:send", async ({ receiverId, body, clientId } = {}, ack) => {
    try {
      let message = await messagesService.sendMessage({
        senderId: userId,
        receiverId,
        body,
      });

      // Receiver has a live connection -> it is delivered the moment it is sent.
      if (isOnline(receiverId)) {
        message = (await messagesService.markDelivered(message.id)) || message;
      }

      // clientId is not stored; it only lets the sender match this message to
      // the optimistic bubble it already drew.
      const payload =
        typeof clientId === "string" && clientId
          ? { ...message, clientId: clientId.slice(0, 64) }
          : message;

      io.to(`user:${receiverId}`).to(`user:${userId}`).emit("message:new", payload);
      ack?.({ message: payload });
    } catch (err) {
      // AppError messages are safe to surface to the client; anything else is not.
      ack?.({ error: err.isOperational ? err.message : "Could not send message" });
      if (!err.isOperational) logger.error("message:send error:", err);
    }
  });

  socket.on("message:typing", ({ receiverId, isTyping } = {}) => {
    if (!Number.isInteger(receiverId)) return;
    io.to(`user:${receiverId}`).emit("message:typing", {
      userId,
      username,
      isTyping: !!isTyping,
    });
  });

  socket.on("message:read", async ({ senderId } = {}) => {
    if (!Number.isInteger(senderId)) return;
    try {
      const rows = await messagesService.markConversationRead({
        senderId,
        receiverId: userId,
      });
      if (rows.length === 0) return;

      io.to(`user:${senderId}`).emit("message:read", {
        by: userId,
        ids: rows.map((r) => r.id),
        readAt: rows[0].read_at,
      });
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
