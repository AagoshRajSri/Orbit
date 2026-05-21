import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { apiLimiter } from "../middleware/rate-limit.middleware.js";
import {
  searchContacts,
  sendContactRequest,
  acceptContactRequest,
  declineContactRequest,
  getPendingRequests
} from "../controllers/contacts.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/search", apiLimiter, searchContacts);
router.post("/request", apiLimiter, sendContactRequest);
router.post("/accept", apiLimiter, acceptContactRequest);
router.post("/decline", apiLimiter, declineContactRequest);
router.get("/pending", getPendingRequests);

export default router;
