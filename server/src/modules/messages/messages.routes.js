import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import validate from "../../middlewares/validate.js";
import asyncHandler from "../../errors/asyncHandler.js";
import messagesController from "./messages.controller.js";
import { getConversationSchema } from "../../validators/message.validator.js";

const router = Router();

router.use(authenticate);

router.get(
  "/:userId",
  validate(getConversationSchema),
  asyncHandler(messagesController.getConversation)
);

export default router;
