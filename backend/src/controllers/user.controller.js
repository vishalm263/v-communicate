import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import mongoose from "mongoose";

// @route   GET /api/users/search
// @desc    Search users by username or fullName
// @access  Private
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    // Search for users with matching username or fullName
    // Exclude the user making the request
    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Not the current user
        {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { fullName: { $regex: query, $options: "i" } }
          ]
        }
      ]
    }).select("-password -interactedUserIds");
    
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers controller:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   GET /api/users/migrate-interactions
// @desc    Migrate existing conversations to interactedUserIds (admin only)
// @access  Private (should be restricted to admins in production)
export const migrateInteractions = async (req, res) => {
  try {
    // Get all messages
    const messages = await Message.find({}).sort({ createdAt: -1 });
    
    // Create a map to track interactions
    const interactions = new Map();
    
    // Process each message to build the interaction map
    messages.forEach(message => {
      const senderId = message.senderId.toString();
      const receiverId = message.receiverId.toString();
      
      // Add receiver to sender's interactions
      if (!interactions.has(senderId)) {
        interactions.set(senderId, new Set());
      }
      interactions.get(senderId).add(receiverId);
      
      // Add sender to receiver's interactions
      if (!interactions.has(receiverId)) {
        interactions.set(receiverId, new Set());
      }
      interactions.get(receiverId).add(senderId);
    });
    
    // Update all users with their interactions
    let updateCount = 0;
    for (const [userId, interactedSet] of interactions.entries()) {
      const interactedUserIds = Array.from(interactedSet).map(
        id => new mongoose.Types.ObjectId(id)
      );
      
      await User.findByIdAndUpdate(
        userId,
        { $addToSet: { interactedUserIds: { $each: interactedUserIds } } },
        { new: true }
      );
      
      updateCount++;
    }
    
    res.status(200).json({ 
      message: `Migration complete. Updated ${updateCount} users with interaction data.` 
    });
  } catch (error) {
    console.error("Error in migrateInteractions controller:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}; 