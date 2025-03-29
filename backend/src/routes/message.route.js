import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage, 
  markMessageAsSeen, 
  deleteMessage,
  reactToMessage,
  editMessage,
  deleteConversation
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.put("/seen/:id", protectRoute, markMessageAsSeen);
router.put("/react/:id", protectRoute, reactToMessage);
router.put("/edit/:id", protectRoute, editMessage);
router.delete("/:id", protectRoute, deleteMessage);
router.delete("/conversation/:id", protectRoute, deleteConversation);

export default router;
