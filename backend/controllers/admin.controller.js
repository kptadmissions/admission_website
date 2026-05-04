// backend/controllers/admin.controller.js

import User from "../models/User.js";
import AccessControl from "../models/AccessControl.js";
import Application from "../models/Application.js";
import XLSX from "xlsx";

import ExcelJS from "exceljs";


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
    const applications = await Application.find().lean();

    const users = await User.find({}, "clerkUserId name").lean();
    const userMap = new Map();
    users.forEach(u => userMap.set(u.clerkUserId, u.name));

    const getSpecialCategories = (sc) => {
      if (!sc) return "-";
      return Object.entries(sc)
        .filter(([_, val]) => val === true || val === "Yes")
        .map(([key]) => key)
        .join(", ");
    };

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Admissions");

    // 🔥 TITLE
    worksheet.mergeCells("A1:Z1");
    worksheet.getCell("A1").value =
      "KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE";
    worksheet.getCell("A1").font = {
      size: 18,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E78" }, // blue
    };

    worksheet.mergeCells("A2:Z2");
    worksheet.getCell("A2").value = "ADMISSIONS 2026-27";
    worksheet.getCell("A2").font = {
      size: 14,
      bold: true,
      color: { argb: "FFFFFFFF" },
    };
    worksheet.getCell("A2").alignment = { horizontal: "center" };
    worksheet.getCell("A2").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF305496" },
    };

    // 🔥 HEADERS (ALL FIELDS)
    const headers = [
      "Sl No",
      "Application Number",
      "SATS Number",
      "Aadhaar Number",
      "SSLC Register Number",
      "Name",
      "Father Name",
      "Mother Name",
      "DOB",
      "Gender",
      "Nationality Indian",
      "Religion",
      "Mobile",
      "Parent Mobile",
      "Email",
      "Address",
      "State",
      "District",
      "Pincode",
      "Qualifying Exam",
      "Passing Year",
      "SSLC Max Marks",
      "SSLC Obtained",
      "Science Marks",
      "Maths Marks",
      "Total Science + Maths",
      "Category",
      "Caste Name",
      "Income",
      "Certificate Available",
      "Acknowledgement No",
      "Rural",
      "Kannada Medium",
      "Hyderabad Karnataka",
      "Special Category",
      "Created By",
      "Edited By",
    ];

    const headerRow = worksheet.addRow(headers);

    // 🎨 HEADER STYLE
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      cell.alignment = { horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // 🔥 DATA ROWS
    applications.forEach((app, index) => {
      let createdByName = app.createdBy?.name || "-";
      let editedByName = app.editedBy?.name || "-";

      if (app.createdBy?.clerkId) {
        createdByName = userMap.get(app.createdBy.clerkId) || createdByName;
      }

      if (app.editedBy?.clerkId) {
        editedByName = userMap.get(app.editedBy.clerkId) || editedByName;
      }

      const row = worksheet.addRow([
        index + 1,
        app.applicationNumber || "-",
        app.basicDetails?.satsNumber || "-",
        app.basicDetails?.aadharNumber || "-",
        app.educationalParticulars?.sslcRegisterNumber || "-", // ✅ FIXED POSITION
        app.basicDetails?.name || "-",
        app.basicDetails?.fatherName || "-",
        app.basicDetails?.motherName || "-",
        app.basicDetails?.dob
          ? new Date(app.basicDetails.dob).toLocaleDateString()
          : "-",
        app.basicDetails?.gender || "-",
        app.basicDetails?.nationality || "-",
        app.basicDetails?.religion || "-",
        app.contactDetails?.mobile || "-",
        app.contactDetails?.parentMobile || "-",
        app.contactDetails?.email || "-",
        app.contactDetails?.address || "-",
        app.contactDetails?.state || "-",
        app.contactDetails?.district || "-",
        app.contactDetails?.pincode || "-",
        app.qualifyingDetails?.qualifyingExam || "-",
        app.educationalParticulars?.sslcPassingYear || "-",
        app.educationalParticulars?.sslcMaxMarks || "-",
        app.educationalParticulars?.sslcObtainedMarks || "-",
        app.educationalParticulars?.obtainedScienceMarks || "-",
        app.educationalParticulars?.obtainedMathsMarks || "-",
        app.educationalParticulars?.totalObtainedScienceMaths || "-",
        app.categoryDetails?.category || "-",
        app.categoryDetails?.casteName || "-",
        app.categoryDetails?.annualIncome || "-",
        app.categoryDetails?.hasCertificate || "-",
        app.categoryDetails?.acknowledgementNumber || "-",
        app.studyEligibility?.isRural || "-",
        app.studyEligibility?.isKannadaMedium || "-",
        app.exemptionClaims?.isHyderabadKarnataka || "-",
        getSpecialCategories(app.specialCategory),
        createdByName,
        editedByName,
      ]);

      // 🎨 Zebra rows
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
          };
        });
      }
    });

    // 📏 AUTO WIDTH
    worksheet.columns.forEach((col) => {
      col.width = 20;
    });

    // 🔥 RESPONSE
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=KPT_Admissions_2026-27.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Export Error:", error);
    res.status(500).json({ error: "Export failed" });
  }
};