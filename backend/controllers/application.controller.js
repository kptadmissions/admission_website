import Application from "../models/application.model.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  applicationSubmittedTemplate,
  applicationResubmittedTemplate
} from "../utils/emailTemplates.js";

/* =====================================================
 CREATE OR SUBMIT APPLICATION
===================================================== */

export const createApplication = async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId;
    const year = req.body.admissionYear || "2025-26";

    let application = await Application.findOne({
      studentClerkId: clerkUserId,
      admissionYear: year
    });

    if (application && application.status === "VERIFIED") {
      return res.status(400).json({ message: "Application already verified" });
    }

    const {
      admissionType,
      personalDetails,
      academicDetails,
      categoryDetails,
      branchPreferences,
      documents,
      studyDetails
    } = req.body;

    /* =========================
       VALIDATION
    ========================= */

    if (!personalDetails?.name || !personalDetails?.mobile) {
      return res.status(400).json({ message: "Missing personal details" });
    }

    if (!studyDetails || studyDetails.length !== 10) {
      return res.status(400).json({ message: "Study details must be 10 rows" });
    }

    /* =========================
       SANITIZE DATA
    ========================= */

    const sanitizedAcademicDetails = {
      ...academicDetails,
      sslcMaxMarks: Number(academicDetails.sslcMaxMarks || 0),
      sslcObtainedMarks: Number(academicDetails.sslcObtainedMarks || 0),
      itiPucMaxMarks: Number(academicDetails.itiPucMaxMarks || 0),
      itiPucObtainedMarks: Number(academicDetails.itiPucObtainedMarks || 0),
    };

    const sanitizedCategoryDetails = {
      ...categoryDetails,
      annualIncome: Number(categoryDetails.annualIncome || 0),
    };

    const sanitizedStudyDetails = studyDetails.map((row) => ({
      level: row.level,
      academicYear: row.academicYear,
      schoolName: row.schoolName,
      district: row.district,
      state: row.state,
      source: row.source || "MANUAL"
    }));

    /* =========================
       PREPARE DATA
    ========================= */

    const updateData = {
      admissionType,
      personalDetails,
      academicDetails: sanitizedAcademicDetails,
      categoryDetails: sanitizedCategoryDetails,
      branchPreferences,
      documents,
      studyDetails: sanitizedStudyDetails,
      status: "SUBMITTED",
      studentClerkId: clerkUserId,
      admissionYear: year,
    };

    let isNew = false;

    if (application) {
      application.set(updateData);
      await application.save();
    } else {
      application = new Application(updateData);
      await application.save();
      isNew = true;
    }

    /* =========================
       EMAIL
    ========================= */

    if (application.personalDetails?.email) {
      try {
        await sendEmail({
          to: application.personalDetails.email,
          subject: "Application Submitted Successfully",
          html: applicationSubmittedTemplate(application.personalDetails.name),
        });
      } catch (err) {
        console.error("Email error:", err.message);
      }
    }

    return res.status(isNew ? 201 : 200).json({
      message: isNew ? "Application Created" : "Application Updated",
      application,
    });

  } catch (err) {
    console.error("Submission Error:", err);
    res.status(500).json({ message: err.message || "Submission failed" });
  }
};

/* =====================================================
 GET MY APPLICATION
===================================================== */

export const getMyApplication = async (req, res) => {
  try {
    const year = req.query.year || "2025-26";

    const app = await Application.findOne({
      studentClerkId: req.clerkUserId,
      admissionYear: year
    });

    res.json({ application: app });

  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ message: "Failed to fetch application" });
  }
};

/* =====================================================
 UPDATE AFTER CORRECTION
===================================================== */

export const updateMyApplication = async (req, res) => {
  try {
    const app = await Application.findOne({
      studentClerkId: req.clerkUserId,
    });

    if (!app) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (!["CORRECTION_REQUIRED", "DRAFT"].includes(app.status)) {
      return res.status(403).json({ message: "Edit not allowed" });
    }

    const {
      admissionType,
      admissionYear,
      personalDetails,
      academicDetails,
      categoryDetails,
      branchPreferences,
      documents,
      studyDetails
    } = req.body;

    /* =========================
       SANITIZE
    ========================= */

    const sanitizedAcademicDetails = {
      ...academicDetails,
      sslcMaxMarks: Number(academicDetails.sslcMaxMarks || 0),
      sslcObtainedMarks: Number(academicDetails.sslcObtainedMarks || 0),
      itiPucMaxMarks: Number(academicDetails.itiPucMaxMarks || 0),
      itiPucObtainedMarks: Number(academicDetails.itiPucObtainedMarks || 0),
    };

    const sanitizedCategoryDetails = {
      ...categoryDetails,
      annualIncome: Number(categoryDetails.annualIncome || 0),
    };

    const sanitizedStudyDetails = (studyDetails || []).map((row) => ({
      level: row.level,
      academicYear: row.academicYear,
      schoolName: row.schoolName,
      district: row.district,
      state: row.state,
      source: row.source || "MANUAL"
    }));

    /* =========================
       UPDATE
    ========================= */

    app.personalDetails = personalDetails;
    app.academicDetails = sanitizedAcademicDetails;
    app.categoryDetails = sanitizedCategoryDetails;
    app.branchPreferences = branchPreferences;
    app.documents = documents;
    app.studyDetails = sanitizedStudyDetails;

    app.admissionType = admissionType;
    app.admissionYear = admissionYear || app.admissionYear;

    app.status = "SUBMITTED";
    app.remarks = "";

    await app.save();

    /* =========================
       EMAIL
    ========================= */

    if (app.personalDetails?.email) {
      try {
        await sendEmail({
          to: app.personalDetails.email,
          subject: "Application Resubmitted",
          html: applicationResubmittedTemplate(app.personalDetails.name),
        });
      } catch (err) {
        console.error("Resubmit Email error:", err.message);
      }
    }

    res.json({ message: "Application resubmitted successfully" });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ message: err.message || "Update failed" });
  }
};