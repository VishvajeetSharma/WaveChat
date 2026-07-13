import { Router } from "express";
import authenticate from "../../middlewares/authenticate.js";
import asyncHandler from "../../errors/asyncHandler.js";
import usersController from "./users.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", asyncHandler(usersController.list));

export default router;
