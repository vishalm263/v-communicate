import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { searchUsers, migrateInteractions } from "../controllers/user.controller.js";

const router = express.Router();

// Search for users by username or fullName
router.get("/search", protectRoute, searchUsers);

// Migration route (should be restricted in production)
router.get("/migrate-interactions", protectRoute, migrateInteractions);

export default router; 