import express from "express";

import {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  toggleEditAccess,
} from "../controllers/admin.controller.js";

import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = express.Router();

/**
 * 🔐 ALL ROUTES → ADMIN ONLY
 */

// ✅ Get all staff users (with access control)
router.get(
  "/users",
  requireAuth,
  requireRole(["admin"]),
  getAllUsers
);

// ✅ Create or update user
router.post(
  "/users",
  requireAuth,
  requireRole(["admin"]),
  createUser
);

// ✅ Update role (admin ↔ verification_officer)
router.patch(
  "/users/:userId/role",
  requireAuth,
  requireRole(["admin"]),
  updateUserRole
);

// ✅ Toggle edit page access (🔥 MAIN FEATURE)
router.patch(
  "/users/:userId/toggle-edit-access",
  requireAuth,
  requireRole(["admin"]),
  toggleEditAccess
);

// ✅ Delete user (except admin)
router.delete(
  "/users/:userId",
  requireAuth,
  requireRole(["admin"]),
  deleteUser
);

export default router;