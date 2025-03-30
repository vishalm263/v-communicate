import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

// More permissive CORS handling
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Debugging middleware to check for cookies and auth headers
app.use((req, res, next) => {
  console.log('Cookies received:', req.cookies);
  console.log('Auth header:', req.headers.authorization);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Add a test route
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is running" });
});

server.listen(PORT, () => {
  console.log("Server is running on PORT:" + PORT);
  connectDB();
});
