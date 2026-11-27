import messagesRepository from "./messages.repository.js";
import { AppError } from "../../errors/AppError.js";

const MAX_MESSAGE_LENGTH = 4000;

export const messagesService = {
  async getConversation({ currentUserId, otherUserId, before, limit }) {
    const messages = await messagesRepository.findConversation({
      userAId: currentUserId,
      userBId: otherUserId,
      before,
      limit,
    });

    // NOTE: loading history deliberately does NOT mark messages as seen.
    // "Seen" is reported over the socket (message:read) so the sender can be
    // notified in real time; the client emits it once the chat is actually
    // on screen.
    return messages;
  },

  async sendMessage({ senderId, receiverId, body }) {
    const trimmed = (body || "").trim();

    if (!trimmed) {
      throw AppError.badRequest("Message cannot be empty");
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw AppError.badRequest(`Message must be under ${MAX_MESSAGE_LENGTH} characters`);
    }
    if (!Number.isInteger(receiverId)) {
      throw AppError.badRequest("Invalid recipient");
    }
    if (receiverId === senderId) {
      throw AppError.badRequest("Cannot message yourself");
    }

    return messagesRepository.create({ senderId, receiverId, body: trimmed });
  },

  /** @returns {Promise<{id:number, read_at:string}[]>} messages that just turned "seen" */
  async markConversationRead({ senderId, receiverId }) {
    return messagesRepository.markRead({ senderId, receiverId });
  },

  async markDelivered(messageId) {
    return messagesRepository.markDelivered(messageId);
  },

  /** @returns {Promise<{id:number, sender_id:number, delivered_at:string}[]>} */
  async markAllDeliveredTo(receiverId) {
    return messagesRepository.markAllDelivered(receiverId);
  },
};

export default messagesService;
