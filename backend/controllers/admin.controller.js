import User from "../models/User.js";
import AccessControl from "../models/AccessControl.js";

// ✅ KEEP ONLY ONE DECLARATION
const STAFF_ROLES = ["admin", "verification_officer"];

export const createUser = async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        error: "Name, Email & Role are required",
      });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        error: "Invalid role selected",
      });
    }

    let user = await User.findOne({ email });

    if (user) {
      user.name = name;
      user.role = role;
      await user.save();

      let access = await AccessControl.findOne({ userId: user._id });

      if (!access) {
        await AccessControl.create({
          userId: user._id,
          canEditApplication: false,
        });
      }

      return res.json({
        success: true,
        message: "User updated successfully",
        user,
      });
    }

    user = await User.create({ name, email, role });

    await AccessControl.create({
      userId: user._id,
      canEditApplication: false,
    });

    res.status(201).json({
      success: true,
      message: "Staff user created successfully",
      user,
    });

  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: STAFF_ROLES },
    }).sort({ createdAt: -1 });

    const accessList = await AccessControl.find();

    // ✅ Create Map (fast lookup)
    const accessMap = new Map();
    accessList.forEach(a => {
      accessMap.set(a.userId.toString(), a);
    });

    // ✅ ONLY ONE result declaration
    const result = users.map((u) => {
      const access = accessMap.get(u._id.toString());

      return {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        canEditApplication: access?.canEditApplication || false,
      };
    });

    res.json(result);

  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ error: "Server error" });
  }
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

export const deleteUser = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  if (user.role === "admin") {
    return res.status(403).json({ error: "Cannot delete admin users." });
  }

  await User.findByIdAndDelete(userId);
await AccessControl.findOneAndDelete({ userId });
  res.json({ success: true, message: "User deleted successfully" });
};

export const toggleEditAccess = async (req, res) => {
  try {
    const { userId } = req.params;

    let access = await AccessControl.findOne({ userId });

    if (!access) {
      access = await AccessControl.create({
        userId,
        canEditApplication: false,
      });
    }

    access.canEditApplication = !access.canEditApplication;
    await access.save();

    res.json({
      success: true,
      canEditApplication: access.canEditApplication,
    });

  } catch (error) {
    console.error("Toggle Access Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};