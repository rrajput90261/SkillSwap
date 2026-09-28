import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  createChat,
  getMyChats,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/", authMiddleware, createChat);

router.get("/", authMiddleware, getMyChats);

export default router;