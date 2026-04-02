import express from "express";
import {
  generateMeritList,
  getMeritList,
  startPhysicalVerification   // 👈 ADD THIS
} from "../controllers/merit.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

// generate merit
router.post(
  "/generate",
  requireAuth,
  requireRole(["verification_officer"]),
  generateMeritList
);
// move to physical verification
router.post(
  "/start-verification",
  requireAuth,
  requireRole(["verification_officer"]),
  startPhysicalVerification
);

// 🔥 view merit list
router.get(
  "/list",
  requireAuth,
  requireRole(["verification_officer"]),
  getMeritList
);

export default router;
