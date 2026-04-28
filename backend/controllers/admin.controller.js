import User from "../models/User.js";

// Only these roles are visible in this panel
const STAFF_ROLES = ["admin", "verification_officer"];

export const getAllUsers = async (req, res) => {
  // Query Filter: Exclude students immediately from DB
  const users = await User.find({ 
    role: { $in: STAFF_ROLES } 
  }).sort({ createdAt: -1 });

 res.json(
  users.map((u) => ({
    id: u._id,
    name: u.name,   // ✅ ADD THIS LINE
    email: u.email,
    role: u.role,
  }))
);
};

export const createUser = async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ error: "Name, Email & role required" });
  }

  if (!STAFF_ROLES.includes(role)) {
    return res.status(400).json({ error: "Invalid role selected" });
  }

  let user = await User.findOne({ email });

  // ✅ IF EXISTS → UPDATE
  if (user) {
    user.role = role;
    user.name = name; // ✅ update name also
    await user.save();

    return res.json({
      success: true,
      message: "User already exists, updated",
      user,
    });
  }

  // ✅ CREATE NEW
  user = await User.create({ name, email, role });

  res.status(201).json({
    success: true,
    message: "Staff user created",
    user,
  });
};

export const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!STAFF_ROLES.includes(role)) {
    return res.status(400).json({ error: "Invalid role update" });
  }

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.role = role;
  await user.save();

  res.json({ success: true });
};

// NEW: Delete Controller
export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Security: Prevent deleting Admins via API
  if (user.role === 'admin') {
     return res.status(403).json({ error: "Cannot delete admin users." });
  }

  await User.findByIdAndDelete(userId);
  res.json({ success: true, message: "User deleted successfully" });
};