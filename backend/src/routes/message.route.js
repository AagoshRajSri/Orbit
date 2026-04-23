import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getMessage,
  getUsersForSidebar,
  sendMessage,
  deleteMessage,
  updateMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessage);

router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:messageId", protectRoute, deleteMessage);
router.patch("/:messageId", protectRoute, updateMessage);

export default router;
