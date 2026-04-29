import express from "express";
import {
  submitApplication,
  updateApplication,
  getBySSLC,
  searchApplications
} from "../controllers/application.officer.controller.js";

import { requireAuth } from "@clerk/express";
import { requireEditAccess } from "../middlewares/access.js"; // ✅ ADD THIS

const router = express.Router();

// 🔐 Officer submits form
router.post("/submit", requireAuth(),  submitApplication);

// 🔍 ADVANCED SEARCH (PROTECTED)
router.get("/search-all", requireAuth(), requireEditAccess, searchApplications);

// 🔍 Public search (no login needed)
router.get("/search", getBySSLC);

// 🔐 UPDATE (PROTECTED)
router.put("/update/:sslc", requireAuth(), requireEditAccess, updateApplication);

export default router;