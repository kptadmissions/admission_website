import Application from "../models/application.model.js";
import AdmissionSettings from "../models/AdmissionSettings.js";

export const getVerificationList = async (req, res) => {
  try {
    const { status, search } = req.query;

    const settings = await AdmissionSettings.findOne();
    const activeType = settings.normalActive ? "NORMAL" : "LATERAL";

    let query = {
      admissionType: activeType
    };

    // ✅ FIXED STATUS HANDLING
    if (status === "PENDING") {
      query.status = "PHYSICAL_VERIFICATION_PENDING";
    } 
    else if (status === "VERIFIED") {
      query.status = "DOCUMENTS_VERIFIED";
    } 
    else if (status === "FAILED") {
      query.status = "DOCUMENTS_FAILED"; // ✅ FIXED
    }

    // 🔍 Search
    if (search) {
      query.$or = [
        { "personalDetails.name": { $regex: search, $options: "i" } },
        { "personalDetails.mobile": { $regex: search, $options: "i" } },
        { "personalDetails.aadharNumber": { $regex: search, $options: "i" } },
      ];
    }

    const applications = await Application.find(query).sort({ rank: 1 });

    res.json({ applications });

  } catch (err) {
    res.status(500).json({ message: "Failed to fetch list" });
  }
};

/* =========================================
   2. VERIFY ACTION (Intermediate Step)
   ========================================= */
export const verifyDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { failedDocs = [], remarks } = req.body;

    const app = await Application.findById(id);
    if (!app) return res.status(404).json({ message: "Not found" });

    /* =========================
       1. CRITICAL DOCUMENT CHECK
    ========================= */

    const criticalDocs = ["sslc", "aadhaar", "tc", "study"];

    const hasCriticalFail = failedDocs.some(doc =>
      criticalDocs.includes(doc)
    );

    if (hasCriticalFail) {
      app.status = "REJECTED";

      app.physicalVerification = {
        verified: false,
        verifiedBy: req.auth.userId,
        verifiedAt: new Date(),
        remarks: "Critical documents missing"
      };

      await app.save();

      return res.json({
        success: false,
        message: "Application Rejected (critical documents missing)"
      });
    }

    /* =========================
       2. RESERVATION FIX
    ========================= */

    // ✅ caste only if NOT GM
    if (
      app.categoryDetails.category !== "GM" &&
      failedDocs.includes("caste")
    ) {
      app.categoryDetails.category = "GM";
      app.categoryDetails.casteName = "";
    }

    // rural removal
    if (failedDocs.includes("rural")) {
      app.categoryDetails.isRural = false;
    }

    // kannada removal
    if (failedDocs.includes("kannada")) {
      app.categoryDetails.isKannadaMedium = false;
    }

    /* =========================
       3. FINAL SUCCESS
    ========================= */

    app.physicalVerification = {
      verified: true,
      verifiedBy: req.auth.userId,
      verifiedAt: new Date(),
      remarks: remarks || ""
    };

    app.status = "DOCUMENTS_VERIFIED";

    await app.save();

    res.json({
      success: true,
      message: "Documents Verified Successfully"
    });

  } catch (err) {
    res.status(500).json({ message: "Verification failed" });
  }
};