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

    // Viewing the conversation marks the other person's messages as read.
    await messagesRepository.markRead({ senderId: otherUserId, receiverId: currentUserId });

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

  async markConversationRead({ senderId, receiverId }) {
    await messagesRepository.markRead({ senderId, receiverId });
  },
};

export default messagesService;
