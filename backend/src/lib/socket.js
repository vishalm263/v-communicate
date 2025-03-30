import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// Store typing status
const typingUsers = {}; // {userId: {receiverId: timestamp}}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // Emit only users who don't have hideActiveStatus enabled
  const getOnlineUsers = async () => {
    try {
      const onlineUserIds = Object.keys(userSocketMap);
      
      // Get users with hideActiveStatus = true
      const hiddenUsers = await User.find({ 
        _id: { $in: onlineUserIds },
        hideActiveStatus: true
      }).select("_id");
      
      // Filter out users who want to hide their status
      const visibleOnlineUsers = onlineUserIds.filter(
        id => !hiddenUsers.some(user => user._id.toString() === id)
      );
      
      io.emit("getOnlineUsers", visibleOnlineUsers);
    } catch (error) {
      console.error("Error getting online users:", error);
      io.emit("getOnlineUsers", []);
    }
  };

  getOnlineUsers();

  // Handle typing events
  socket.on("typing", ({ receiverId }) => {
    if (!userId || !receiverId) return;
    
    // Set typing status with timestamp
    if (!typingUsers[userId]) typingUsers[userId] = {};
    typingUsers[userId][receiverId] = Date.now();
    
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId });
    }
  });
  
  socket.on("stopTyping", ({ receiverId }) => {
    if (!userId || !receiverId) return;
    
    // Remove typing status
    if (typingUsers[userId]) {
      delete typingUsers[userId][receiverId];
    }
    
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", { userId });
    }
  });

  // Clean up old typing statuses every minute
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    const timeoutDuration = 10000; // 10 seconds
    
    Object.keys(typingUsers).forEach(senderId => {
      Object.keys(typingUsers[senderId]).forEach(receiverId => {
        if (now - typingUsers[senderId][receiverId] > timeoutDuration) {
          delete typingUsers[senderId][receiverId];
          
          const receiverSocketId = userSocketMap[receiverId];
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("userStoppedTyping", { userId: senderId });
          }
        }
      });
    });
  }, 60000); // Run every minute

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    
    // Clean up typing status for this user
    delete typingUsers[userId];
    
    // Clear the interval when the socket disconnects
    clearInterval(cleanupInterval);
    
    getOnlineUsers();
  });
});

export { io, app, server };
