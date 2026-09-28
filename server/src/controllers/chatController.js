import Chat from "../models/chat.js";
import User from "../models/user.js";

// Create or get existing chat
const createChat = async (req, res) => {
  try {
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (receiverId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot create chat with yourself",
      });
    }

    const receiver = await User.findById(receiverId);

    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check whether chat already exists
    let chat = await Chat.findOne({
      participants: {
        $all: [req.user.userId, receiverId],
      },
    }).populate("participants", "name email profileImage");

    // If chat doesn't exist, create it
    if (!chat) {
      chat = await Chat.create({
        participants: [req.user.userId, receiverId],
      });

      chat = await chat.populate(
        "participants",
        "name email profileImage"
      );
    }

    res.status(200).json({
      success: true,
      message: "Chat ready",
      chat,
    });
  } catch (error) {
    console.error("Create chat error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get my chats
const getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.userId,
    })
      .populate("participants", "name email profileImage")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error("Get chats error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export { createChat, getMyChats };