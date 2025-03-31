import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import mongoose from "mongoose";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    
    // Get the current user with populated interactedUserIds
    const currentUser = await User.findById(loggedInUserId)
      .populate({
        path: 'interactedUserIds',
        select: '-password -interactedUserIds'
      });
    
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Send the interacted users
    const interactedUsers = currentUser.interactedUserIds || [];
    
    // If no interactions yet, return an empty array
    // (Frontend will handle showing the "Find people" prompt)
    res.status(200).json(interactedUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Update interactedUserIds for both users if they don't already exist
    await updateInteractedUsers(myId, userToChatId);

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).populate("replyTo");

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, replyToId } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Update interactedUserIds for both users
    await updateInteractedUsers(senderId, receiverId);

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      replyTo: replyToId || null,
    });

    await newMessage.save();

    // Mark previous messages as seen
    await Message.updateMany(
      { senderId: receiverId, receiverId: senderId, seen: false },
      { seen: true }
    );

    const populatedMessage = await Message.findById(newMessage._id).populate("replyTo");

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", populatedMessage);
    }

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to update interactedUserIds for both users
const updateInteractedUsers = async (userId1, userId2) => {
  // Convert to ObjectId if they are strings
  const user1Id = typeof userId1 === 'string' ? new mongoose.Types.ObjectId(userId1) : userId1;
  const user2Id = typeof userId2 === 'string' ? new mongoose.Types.ObjectId(userId2) : userId2;
  
  // Update first user's interactions
  await User.findByIdAndUpdate(
    user1Id,
    { 
      $addToSet: { interactedUserIds: user2Id } 
    },
    { new: true }
  );
  
  // Update second user's interactions
  await User.findByIdAndUpdate(
    user2Id,
    { 
      $addToSet: { interactedUserIds: user1Id } 
    },
    { new: true }
  );
};

export const markMessageAsSeen = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only mark as seen if the user is the receiver
    if (message.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to mark this message as seen" });
    }

    message.seen = true;
    await message.save();

    const senderSocketId = getReceiverSocketId(message.senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("messageSeen", messageId);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in markMessageAsSeen controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow deletion if the user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to delete this message" });
    }

    // Mark as deleted but don't include any text
    message.isDeleted = true;
    message.text = "";
    message.image = null;
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", messageId);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const reactToMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user already reacted, remove the reaction if they did
    const existingReaction = message.reactions.findIndex(
      reaction => reaction.userId.toString() === userId.toString()
    );

    if (existingReaction !== -1) {
      // If same emoji, remove it (toggle off)
      if (message.reactions[existingReaction].emoji === emoji) {
        message.reactions.splice(existingReaction, 1);
      } else {
        // If different emoji, update it
        message.reactions[existingReaction].emoji = emoji;
      }
    } else {
      // Add new reaction
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Notify the other user about the reaction
    const otherUserId = message.senderId.toString() === userId.toString() 
      ? message.receiverId.toString() 
      : message.senderId.toString();
    
    const otherUserSocketId = getReceiverSocketId(otherUserId);
    if (otherUserSocketId) {
      io.to(otherUserSocketId).emit("messageReaction", {
        messageId,
        userId,
        emoji,
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in reactToMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only allow editing if the user is the sender
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized to edit this message" });
    }

    // Check if message is too old to edit (1 hour limit)
    const messageTime = new Date(message.createdAt).getTime();
    const currentTime = new Date().getTime();
    const hourInMs = 60 * 60 * 1000;
    
    if (currentTime - messageTime > hourInMs) {
      return res.status(400).json({ error: "Cannot edit messages older than 1 hour" });
    }

    message.text = text;
    message.lastEdited = new Date();
    await message.save();

    const receiverSocketId = getReceiverSocketId(message.receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", message);
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const { id: otherUserId } = req.params;
    const userId = req.user._id;

    // Find all messages between these two users
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    });
    
    if (messages.length === 0) {
      return res.status(404).json({ error: "No conversation found" });
    }

    // Soft delete all messages - completely empty content
    await Message.updateMany(
      {
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      {
        isDeleted: true,
        text: "",
        image: null
      }
    );

    // Notify other user if they're online
    const otherUserSocketId = getReceiverSocketId(otherUserId);
    if (otherUserSocketId) {
      // Send event to notify about conversation deletion
      io.to(otherUserSocketId).emit("conversationDeleted", userId);
    }

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (error) {
    console.log("Error in deleteConversation controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
