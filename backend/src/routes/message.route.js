import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { apiLimiter, messageLimiter } from "../middleware/rate-limit.middleware.js";
import {
  getMessage,
  getUsersForSidebar,
  sendMessage,
  deleteMessage,
  updateMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, apiLimiter, getUsersForSidebar);
router.get("/:id", protectRoute, apiLimiter, getMessage);

router.post("/send/:id", protectRoute, messageLimiter, sendMessage);
router.delete("/:messageId", protectRoute, deleteMessage);
router.patch("/:messageId", protectRoute, updateMessage);

export default router;
