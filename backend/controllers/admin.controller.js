// backend/controllers/admin.controller.js

import User from "../models/User.js";
import AccessControl from "../models/AccessControl.js";
import Application from "../models/Application.js";
import XLSX from "xlsx";

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

      category,
      type,
      shift,
      specialCategory,
      isRural,
      isKannadaMedium,
      isHK
    } = req.query;

    const query = {};

    // ✅ DATE FILTER
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);

      query.submittedAt = { $gte: start, $lte: end };
    }

    // ✅ SEARCH
    if (search) {
      query.$or = [
        { applicationNumber: { $regex: search, $options: "i" } },
        { "basicDetails.name": { $regex: search, $options: "i" } }
      ];
    }

    // ✅ FILTERS
    if (category) query["categoryDetails.category"] = category;

    if (type === "GM") query.applicationNumber = { $regex: "^G" };
    else if (type === "Reserved") query.applicationNumber = { $regex: "^C" };

    if (shift === "Day") query.applicationNumber = { $regex: "103" };
    else if (shift === "Evening") query.applicationNumber = { $regex: "186" };

    if (specialCategory && specialCategory !== "NONE") {
      query[`specialCategory.${specialCategory}`] = true;
    }

    if (specialCategory === "NONE") {
      query.$and = [
        { "specialCategory.NCC": { $ne: true } },
        { "specialCategory.PH": { $ne: true } }
      ];
    }

    if (isRural) query["studyEligibility.isRural"] = isRural;
    if (isKannadaMedium) query["studyEligibility.isKannadaMedium"] = isKannadaMedium;
    if (isHK) query["exemptionClaims.isHyderabadKarnataka"] = isHK;

    // ✅ SORT
    const sort = {};
    if (sortBy === "basicDetails.name") {
      sort["basicDetails.name"] = order === "asc" ? 1 : -1;
    } else if (sortBy === "applicationNumber") {
      sort.applicationNumber = order === "asc" ? 1 : -1;
    } else {
      sort.createdAt = -1;
    }

    const skip = (page - 1) * limit;

    // 🔥 FETCH APPLICATIONS
    const applications = await Application.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(); // 🔥 IMPORTANT

    const total = await Application.countDocuments(query);

    // 🔥 FETCH USERS
    const users = await User.find({}, "clerkUserId name").lean();

    // 🔥 MAP clerkUserId → name
    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.clerkUserId, u.name);
    });

    // 🔥 FIX NAMES
    const updatedApplications = applications.map(app => {

      if (app.createdBy?.clerkId) {
        const realName = userMap.get(app.createdBy.clerkId);
        if (realName) app.createdBy.name = realName;
      }

      if (app.editedBy?.clerkId) {
        const realName = userMap.get(app.editedBy.clerkId);
        if (realName) app.editedBy.name = realName;
      }

      return app;
    });

    res.json({
      success: true,
      total,
      page: Number(page),
      data: updatedApplications // ✅ IMPORTANT
    });

  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};



export const exportToExcel = async (req, res) => {
  try {
    // 🔥 Fetch applications
    const applications = await Application.find().lean();

    // 🔥 Fetch users for name mapping
    const users = await User.find({}, "clerkUserId name").lean();
    const userMap = new Map();
    users.forEach(u => {
      userMap.set(u.clerkUserId, u.name);
    });

    // 🔥 Helper: Special Category
    const getSpecialCategories = (sc) => {
      if (!sc) return "-";
      return Object.entries(sc)
        .filter(([_, val]) => val === true || val === "Yes")
        .map(([key]) => key)
        .join(", ");
    };

    // 🔥 Prepare data (YOUR ORDER)
    const exportData = applications.map((app, index) => {

      // Fix createdBy / editedBy names
      let createdByName = app.createdBy?.name || "-";
      let editedByName = app.editedBy?.name || "-";

      if (app.createdBy?.clerkId) {
        createdByName = userMap.get(app.createdBy.clerkId) || createdByName;
      }

      if (app.editedBy?.clerkId) {
        editedByName = userMap.get(app.editedBy.clerkId) || editedByName;
      }

      return {
        // 🟢 1. IDENTIFICATION
        "Sl No": index + 1,
        "Application Number": app.applicationNumber || "-",
        "SATS Number": app.basicDetails?.satsNumber || "-",
        "Aadhaar Number": app.basicDetails?.aadharNumber || "-",

        // 🟢 2. BASIC DETAILS
        "Name": app.basicDetails?.name || "-",
        "Father Name": app.basicDetails?.fatherName || "-",
        "Mother Name": app.basicDetails?.motherName || "-",
        "DOB": app.basicDetails?.dob
          ? new Date(app.basicDetails.dob).toLocaleDateString()
          : "-",
        "Gender": app.basicDetails?.gender || "-",
        "Nationality": app.basicDetails?.nationality || "-",
        "Religion": app.basicDetails?.religion || "-",

        // 🟢 3. CONTACT DETAILS
        "Mobile": app.contactDetails?.mobile || "-",
        "Parent Mobile": app.contactDetails?.parentMobile || "-",
        "Email": app.contactDetails?.email || "-",
        "Address": app.contactDetails?.address || "-",
        "State": app.contactDetails?.state || "-",
        "District": app.contactDetails?.district || "-",
        "Pincode": app.contactDetails?.pincode || "-",

        // 🟢 4. QUALIFICATION
        "Qualifying Exam": app.qualifyingDetails?.qualifyingExam || "-",
        "SSLC Register Number": app.educationalParticulars?.sslcRegisterNumber || "-",
        "Passing Year": app.educationalParticulars?.sslcPassingYear || "-",

        // 🟢 5. MARKS
        "SSLC Max Marks": app.educationalParticulars?.sslcMaxMarks || "-",
        "SSLC Obtained": app.educationalParticulars?.sslcObtainedMarks || "-",
        "Science Marks": app.educationalParticulars?.obtainedScienceMarks || "-",
        "Maths Marks": app.educationalParticulars?.obtainedMathsMarks || "-",
        "Total Science + Maths": app.educationalParticulars?.totalObtainedScienceMaths || "-",

        // 🟢 6. CATEGORY DETAILS
        "Category": app.categoryDetails?.category || "-",
        "Caste Name": app.categoryDetails?.casteName || "-",
        "Income": app.categoryDetails?.annualIncome || "-",
        "Certificate Available": app.categoryDetails?.hasCertificate || "-",
        "Acknowledgement No": app.categoryDetails?.acknowledgementNumber || "-",

        // 🟢 7. ELIGIBILITY
        "Rural": app.studyEligibility?.isRural || "-",
        "Kannada Medium": app.studyEligibility?.isKannadaMedium || "-",
        "Hyderabad Karnataka": app.exemptionClaims?.isHyderabadKarnataka || "-",

        // 🟢 8. SPECIAL CATEGORY
        "Special Category": getSpecialCategories(app.specialCategory),

        // 🟢 9. ADMIN TRACKING
        "Created By": createdByName,
        "Edited By": editedByName
      };
    });

    // 🔥 Create Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 15 },
      { wch: 18 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx"
    });

    // 🔥 Send file
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Applications_Full_Data.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);

  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ error: "Export failed" });
  }
};