import express from "express";
import multer from "multer";

import {
  getExamSettings,
  getAllQuestions,
  updateQuestion,
  deleteQuestion,
  startExam,
  submitExam,
  getExamResult,
  updateExamSettings,
  uploadQuestions
} from "../controllers/exam.controller.js";

import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();
const upload = multer();

/* =========================
PUBLIC
========================= */
router.get("/settings", getExamSettings);

/* =========================
ADMIN ONLY
========================= */

// 🔒 Update exam settings
router.put(
  "/settings",
  requireAuth,
  requireRole(["admin"]),
  updateExamSettings
);

// 🔒 Upload Excel
router.post(
  "/upload",
  requireAuth,
  requireRole(["admin"]),
  upload.single("file"),
  uploadQuestions
);
// GET ALL QUESTIONS
router.get(
  "/questions",
  requireAuth,
  requireRole(["admin"]),
  getAllQuestions
);

// UPDATE QUESTION
router.put(
  "/questions/:id",
  requireAuth,
  requireRole(["admin"]),
  updateQuestion
);

// DELETE QUESTION
router.delete(
  "/questions/:id",
  requireAuth,
  requireRole(["admin"]),
  deleteQuestion
);

/* =========================
STUDENT EXAM
========================= */

// Start exam
router.post("/start", startExam);

// Submit exam
router.post("/submit", submitExam);

// Get result
router.get("/result", getExamResult);
export default router;