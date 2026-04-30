// backend/controllers/admin.controller.js

import User from "../models/User.js";
import AccessControl from "../models/AccessControl.js";
import Application from "../models/Application.js";

// ✅ Roles
const STAFF_ROLES = ["admin", "verification_officer"];


// ===============================
// 🔹 USER MANAGEMENT
// ===============================

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


// ===============================
// 🔹 GET USERS
// ===============================

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: STAFF_ROLES },
    }).sort({ createdAt: -1 });

    const accessList = await AccessControl.find();

    const accessMap = new Map();
    accessList.forEach(a => {
      accessMap.set(a.userId.toString(), a);
    });

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


// ===============================
// 🔹 UPDATE ROLE
// ===============================

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


// ===============================
// 🔹 DELETE USER
// ===============================

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


// ===============================
// 🔹 TOGGLE EDIT ACCESS
// ===============================

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

// ===============================
// 🔥 ADMIN STATISTICS (MAIN API)
// ===============================

export const getApplicationsStats = async (req, res) => {
  try {
    const {
      fromDate,
      toDate,
      search,
      sortBy,
      order = "asc",
      page = 1,
      limit = 20,

      // ✅ NEW FILTERS
      category,
      type,
      shift,
      specialCategory,
      isRural,
      isKannadaMedium,
      isHK
    } = req.query;

    const query = {};

    // ===============================
    // ✅ DATE FILTER
    // ===============================
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.submittedAt = {
        $gte: start,
        $lte: end,
      };
    }

    // ===============================
    // ✅ SEARCH
    // ===============================
    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: "i" } },
        { "basicDetails.name": { $regex: search, $options: "i" } }
      ];
    }

    // ===============================
    // ✅ CATEGORY FILTER
    // ===============================
    if (category) {
      query["categoryDetails.category"] = category;
    }

    // ===============================
    // ✅ TYPE FILTER (G / C)
    // ===============================
    if (type === "GM") {
      query.applicationNumber = { $regex: "^G" };
    } else if (type === "Reserved") {
      query.applicationNumber = { $regex: "^C" };
    }

    // ===============================
    // ✅ SHIFT FILTER (103 / 186)
    // ===============================
    if (shift === "Day") {
      query.applicationNumber = { $regex: "103" };
    } else if (shift === "Evening") {
      query.applicationNumber = { $regex: "186" };
    }

    // ===============================
    // ✅ SPECIAL CATEGORY FILTER (🔥 ALL)
    // ===============================
    if (specialCategory && specialCategory !== "NONE") {
      query[`specialCategory.${specialCategory}`] = true;
    }

    if (specialCategory === "NONE") {
      query.$and = [
        { "specialCategory.NCC": { $ne: true } },
        { "specialCategory.PH": { $ne: true } },
        { "specialCategory.JTS": { $ne: true } },
        { "specialCategory.JOC": { $ne: true } },
        { "specialCategory.EDP": { $ne: true } },
        { "specialCategory.DP": { $ne: true } },
        { "specialCategory.PS": { $ne: true } },
        { "specialCategory.SP": { $ne: true } },
        { "specialCategory.SG": { $ne: true } },
        { "specialCategory.AI": { $ne: true } },
        { "specialCategory.CI": { $ne: true } },
        { "specialCategory.GK": { $ne: true } },
        { "specialCategory.ITI": { $ne: true } }
      ];
    }

    // ===============================
    // ✅ OTHER FILTERS
    // ===============================
    if (isRural) query["studyEligibility.isRural"] = isRural;
    if (isKannadaMedium) query["studyEligibility.isKannadaMedium"] = isKannadaMedium;
    if (isHK) query["exemptionClaims.isHyderabadKarnataka"] = isHK;

    // ===============================
    // ✅ SORTING
    // ===============================
    const sort = {};

    if (sortBy === "basicDetails.name") {
      sort["basicDetails.name"] = order === "asc" ? 1 : -1;
    } else if (sortBy === "applicationNumber") {
      sort.applicationNumber = order === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    // ===============================
    // ✅ PAGINATION
    // ===============================
    const skip = (page - 1) * limit;

    const applications = await Application.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Application.countDocuments(query);

    res.json({
      success: true,
      total,
      page: Number(page),
      data: applications,
    });

  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};