// routes/application.officer.routes.js

import express from "express";
import {
  submitApplication,
  updateApplication,
  getBySSLC,
  searchApplications   // ✅ ADD THIS
} from "../controllers/application.officer.controller.js";

import { requireAuth } from "@clerk/express";

const router = express.Router();

// 🔐 Officer submits form
router.post("/submit", requireAuth(), submitApplication);
// 🔍 ADVANCED SEARCH
router.get("/search-all", requireAuth(), searchApplications);

// 🔍 Public search (no login needed)
router.get("/search", getBySSLC);
router.put("/update/:sslc", requireAuth(), updateApplication);

export default router;