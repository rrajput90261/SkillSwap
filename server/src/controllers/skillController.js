import Skill from "../models/skill.js";
import User from "../models/user.js"

// Add Skill
const addSkill = async (req, res) => {
  try {
    const { name, description, category, level } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Skill name is required",
      });
    }

    const skill = await Skill.create({
      name,
      description,
      category,
      level,
      owner: req.user.userId,
    });

    res.status(201).json({
      success: true,
      message: "Skill added successfully",
      skill,
    });
  } catch (error) {
    console.error("Add skill error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


const getMySkills = async (req, res) => {
  try {
    const skills = await Skill.find({
      owner: req.user.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      skills,
    });
  } catch (error) {
    console.error("Get skills error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Find Skill Matches
const findMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const wantedSkills = currentUser.skillsWanted || [];
    const offeredSkills = currentUser.skillsOffered || [];

    if (wantedSkills.length === 0 || offeredSkills.length === 0) {
      return res.status(200).json({
        success: true,
        matches: [],
        message: "Add both skills offered and skills wanted",
      });
    }

    const users = await User.find({
      _id: { $ne: currentUser._id },

      // Other user should offer what I want
      skillsOffered: { $in: wantedSkills },

      // Other user should want what I offer
      skillsWanted: { $in: offeredSkills },
    }).select("-password");

    res.status(200).json({
      success: true,
      matches: users,
    });
  } catch (error) {
    console.error("Find matches error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get Received Swap Requests
const getReceivedRequests = async (req, res) => {
  try {
    const requests = await SwapRequest.find({
      receiver: req.user.userId,
    })
      .populate("sender", "name email profileImage")
      .sort({ createdAt: -1 });

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
export {
  addSkill,
  getMySkills,
  findMatches,
  getReceivedRequests,
};