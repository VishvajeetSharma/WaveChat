import messagesService from "./messages.service.js";

export const messagesController = {
  async getConversation(req, res) {
    const otherUserId = req.params.userId;
    const { before, limit } = req.query;

    const messages = await messagesService.getConversation({
      currentUserId: req.user.id,
      otherUserId,
      before,
      limit,
    });

    res.json({ messages });
  },
};

export default messagesController;
