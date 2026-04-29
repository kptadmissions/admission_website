//path: backend/middlewares/access.js
import User from "../models/User.js";
import AccessControl from "../models/AccessControl.js";

export const requireEditAccess = async (req, res, next) => {
  try {
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔍 Find user
    const user = await User.findOne({ clerkUserId: clerkId });

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    // ❌ Not verification officer
    if (!["admin", "verification_officer"].includes(user.role)) {
  return res.status(403).json({
    message: "You are not allowed to access this page",
  });
}

    // 🔍 Check access control
    const access = await AccessControl.findOne({ userId: user._id });

    if (!access || !access.canEditApplication) {
      return res.status(403).json({
        message: "You don't have access to this page",
      });
    }

    // ✅ ALLOWED
    next();

  } catch (error) {
    console.error("Access Middleware Error:", error);
    res.status(500).json({ message: "Access check failed" });
  }
};