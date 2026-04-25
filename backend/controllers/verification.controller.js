import Application from "../models/application.model.js";
import ExamResult from "../models/ExamResult.js";
import AdmissionSettings from "../models/AdmissionSettings.js";

/* =====================================================
   VERIFY APPLICATION (FINAL FIXED)
===================================================== */
export const verifyApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { failedDocs = [], remarks } = req.body;

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ message: "Application not found" });

    /* =========================
       CRITICAL DOCUMENTS
    ========================= */
    const criticalDocs = [
      "sslcMarksCard",
      "aadhaarCard",
      "transferCertificate",
      "studyCertificate"
    ];

    /* =========================
       1. CHECK CRITICAL FAIL
    ========================= */
    const hasCriticalFail = failedDocs.some(doc =>
      criticalDocs.includes(doc)
    );

    if (hasCriticalFail) {
      app.status = "REJECTED";
      app.remarks = remarks || "Missing critical documents";

      app.verification = {
        verifiedBy: req.user?.id || "officer",
        verifiedAt: new Date(),
        remarks
      };

      await app.save();

      return res.json({
        success: true,
        status: "REJECTED",
        message: "Application rejected"
      });
    }

    /* =========================
       2. NON-CRITICAL FAIL
    ========================= */
    if (failedDocs.length > 0) {
      app.status = "CORRECTION_REQUIRED";
      app.remarks = remarks || "Please correct the marked issues";

      await app.save();

      return res.json({
        success: true,
        status: "CORRECTION_REQUIRED",
        message: "Correction required"
      });
    }

    /* =========================
       3. CHECK EXAM
    ========================= */
    const exam = await ExamResult.findOne({
      email: app.personalDetails.email
    });

    if (!exam) {
      app.status = "CORRECTION_REQUIRED";
      app.remarks = "Entrance test not completed";

      await app.save();

      return res.json({
        success: false,
        status: "CORRECTION_REQUIRED",
        examRequired: true,
        message: "Exam not completed"
      });
    }

    /* =========================
       4. SAVE EXAM DETAILS
    ========================= */
    const percentage = exam.totalQuestions
      ? (exam.score / exam.totalQuestions) * 100
      : 0;

    app.examDetails = {
      attended: true,
      score: exam.score,
      totalQuestions: exam.totalQuestions,
      percentage: Number(percentage.toFixed(2))
    };

    /* =========================
       5. FINAL VERIFIED
    ========================= */
    app.status = "VERIFIED";
    app.remarks = remarks || "Verified successfully";

    app.verification = {
      verifiedBy: req.user?.id || "officer",
      verifiedAt: new Date(),
      remarks
    };

    await app.save();

    return res.json({
      success: true,
      status: "VERIFIED",
      message: "Application verified successfully"
    });

  } catch (err) {
    console.error("VERIFY ERROR:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};


/* =====================================================
   GET APPLICATIONS (FILTER + SEARCH)
===================================================== */
export const getApplications = async (req, res) => {
  try {
    const { status, search } = req.query;

    /* =========================
       GET ACTIVE ADMISSION TYPE
    ========================= */
    const settings = await AdmissionSettings.findOne();

    let admissionType = "NORMAL";
    if (settings?.normalActive) admissionType = "NORMAL";
    if (settings?.lateralActive) admissionType = "LATERAL";

    let query = { admissionType };

    /* =========================
       STATUS FILTER
    ========================= */
    if (status && status !== "ALL") {
      query.status = status;
    }

    /* =========================
       SEARCH
    ========================= */
    if (search) {
      query.$or = [
        { "personalDetails.name": { $regex: search, $options: "i" } },
        { "personalDetails.mobile": { $regex: search, $options: "i" } },
        { "personalDetails.email": { $regex: search, $options: "i" } },
        { "academicDetails.sslcRegisterNumber": { $regex: search, $options: "i" } },
      ];
    }

    const apps = await Application.find(query).sort({ updatedAt: -1 });

    /* =========================
       CLEAN + ATTACH EXAM
    ========================= */
    const applications = await Promise.all(
      apps.map(async (app) => {
        const obj = app.toObject();

        // Remove empty docs
        const cleanedDocs = {};
        for (const key in obj.documents || {}) {
          if (obj.documents[key]) {
            cleanedDocs[key] = obj.documents[key];
          }
        }
        obj.documents = cleanedDocs;

        // Attach exam
        const exam = await ExamResult.findOne({
          email: obj.personalDetails.email,
        });

        if (exam) {
          const percentage = exam.totalQuestions
            ? (exam.score / exam.totalQuestions) * 100
            : 0;

          obj.examDetails = {
            attended: true,
            score: exam.score,
            totalQuestions: exam.totalQuestions,
            percentage: Number(percentage.toFixed(2)),
          };
        } else {
          obj.examDetails = null;
        }

        return obj;
      })
    );

    res.json({ applications });

  } catch (err) {
    console.error("GET APPLICATION ERROR:", err);
    res.status(500).json({ message: "Error fetching applications" });
  }
};


/* =====================================================
   OFFICER DASHBOARD STATS
===================================================== */
export const getOfficerStats = async (req, res) => {
  try {
    const settings = await AdmissionSettings.findOne();

    let admissionType = null;

    if (settings?.normalActive) admissionType = "NORMAL";
    if (settings?.lateralActive) admissionType = "LATERAL";

    if (!admissionType) {
      return res.json({});
    }

    const base = { admissionType };

    const [
      totalApplications,
      pendingVerification,
      verified,
      rejected,
      correctionRequired,
      admitted
    ] = await Promise.all([
      Application.countDocuments(base),
      Application.countDocuments({ ...base, status: "SUBMITTED" }),
      Application.countDocuments({ ...base, status: "VERIFIED" }),
      Application.countDocuments({ ...base, status: "REJECTED" }),
      Application.countDocuments({ ...base, status: "CORRECTION_REQUIRED" }),
      Application.countDocuments({ ...base, status: "ADMITTED" })
    ]);

    res.json({
      totalApplications,
      pendingVerification,
      verified,
      rejected,
      correctionRequired,
      admitted
    });

  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ message: "Error fetching statistics" });
  }
};