import express from "express";
import User  from "../models/user.js";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  addSkill,
  getMySkills,
  findMatches,
} from "../controllers/skillController.js";

const router = express.Router();


router.post("/", authMiddleware, addSkill);
router.get("/my", authMiddleware, getMySkills);
router.get("/matches", authMiddleware, findMatches);

export default router;