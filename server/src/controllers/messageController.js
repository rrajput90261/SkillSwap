import Message from "../models/message.js";
import Chat from "../models/chat.js";

// Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId, text } = req.body;

    if (!chatId || !text) {
      return res.status(400).json({
        success: false,
        message: "Chat ID and message are required",
      });
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    // Check whether logged-in user belongs to this chat
    const isParticipant = chat.participants.some(
      (participant) =>
        participant.toString() === req.user.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this chat",
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user.userId,
      text: text.trim(),
    });

    const populatedMessage = await message.populate(
      "sender",
      "name email profileImage"
    );

    // Update chat's updatedAt
    chat.updatedAt = new Date();
    await chat.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: populatedMessage,
    });
  } catch (error) {
    console.error("Send message error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get messages of a chat
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found",
      });
    }

    const isParticipant = chat.participants.some(
      (participant) =>
        participant.toString() === req.user.userId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this chat",
      });
    }

    const messages = await Message.find({
      chat: chatId,
    })
      .populate("sender", "name email profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export { sendMessage, getMessages };