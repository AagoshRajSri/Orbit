/**
 * StarWeave Routes — Biometric Gesture Authentication
 *
 * POST /api/starweave/enroll     — register biometric constellation
 * POST /api/starweave/login      — authenticate with gesture pattern
 * GET  /api/starweave/challenge  — fetch anti-replay nonce
 */
import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  enrollHandler,
  loginHandler,
  challengeHandler,
} from '../controllers/starweave.controller.js';

const router = express.Router();

// Ratelimit challenges to prevent nonce spam (max 5 per minute per IP)
const challengeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Too many security challenges requested. Please wait 60 seconds." },
  standardHeaders: true,
  legacyHeaders: false,
});

import { loginLimiter, signupLimiter } from '../middleware/rate-limit.middleware.js';

router.get('/challenge',  challengeLimiter, challengeHandler);
router.post('/enroll',    signupLimiter, enrollHandler);
router.post('/login',     loginLimiter, loginHandler);

export default router;
