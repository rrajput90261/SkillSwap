import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  sendSwapRequest,
  getReceivedRequests,
  updateSwapRequestStatus,
} from "../controllers/swapRequestController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  sendSwapRequest
);
router.get(
  "/received",
  authMiddleware,
  getReceivedRequests
);
router.put(
  "/:requestId",
  authMiddleware,
  updateSwapRequestStatus
);

export default router;