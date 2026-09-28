import SwapRequest from "../models/swapRequest.js";

import User from "../models/user.js";

// Send Swap Request
const sendSwapRequest = async (req, res) => {
  try {
    const {
      receiverId,
      skillOffered,
      skillWanted,
    } = req.body;

    if (!receiverId || !skillOffered || !skillWanted) {
      return res.status(400).json({
        success: false,
        message:
          "Receiver, skill offered and skill wanted are required",
      });
    }

    if (receiverId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send request to yourself",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    const existingRequest = await SwapRequest.findOne({
      sender: req.user.userId,
      receiver: receiverId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: "Swap request already sent",
      });
    }

    const request = await SwapRequest.create({
      sender: req.user.userId,
      receiver: receiverId,
      skillOffered,
      skillWanted,
    });

    res.status(201).json({
      success: true,
      message: "Swap request sent successfully",
      request,
    });
  } catch (error) {
    console.error("Send swap request error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const getReceivedRequests = async (req, res) => {
  try {
    console.log("Logged in user ID:", req.user.userId);

    const allRequests = await SwapRequest.find();

    console.log("ALL SWAP REQUESTS:", allRequests);

    const requests = await SwapRequest.find({
      receiver: req.user.userId,
    })
      .populate("sender", "name email profileImage")
      .sort({ createdAt: -1 });

    console.log("Received requests:", requests);

    res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Get received requests error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Accept or Reject Swap Request
const updateSwapRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be accepted or rejected",
      });
    }

    const request = await SwapRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Swap request not found",
      });
    }

    if (request.receiver.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this request",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This request has already been processed",
      });
    }

    request.status = status;

    await request.save();

    res.status(200).json({
      success: true,
      message: `Swap request ${status} successfully`,
      request,
    });
  } catch (error) {
    console.error("Update swap request error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
export {
  sendSwapRequest,
  getReceivedRequests,
  updateSwapRequestStatus,
};