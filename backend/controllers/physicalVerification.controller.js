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

    // ❌ CRITICAL FAIL
    if (failedDocs.includes("sslc") || failedDocs.includes("aadhaar")) {
      app.status = "REJECTED";

      app.physicalVerification = {
        verified: false,
        verifiedBy: req.auth.userId,
        verifiedAt: new Date(),
        remarks: "Critical document failed"
      };

      await app.save();

      return res.json({
        success: false,
        message: "Application Rejected (invalid documents)"
      });
    }

    // 🟨 RESERVATION FIX
    if (failedDocs.includes("caste")) {
      app.categoryDetails.category = "GM";
      app.categoryDetails.casteName = "";
    }

    if (failedDocs.includes("rural")) {
      app.categoryDetails.isRural = false;
    }

    if (failedDocs.includes("kannada")) {
      app.categoryDetails.isKannadaMedium = false;
    }

    // ❌ NON-CRITICAL FAIL → mark failed
    if (failedDocs.length > 0) {
      app.status = "DOCUMENTS_FAILED";

      app.physicalVerification = {
        verified: false,
        verifiedBy: req.auth.userId,
        verifiedAt: new Date(),
        remarks: remarks || "Documents mismatch"
      };

      await app.save();

      return res.json({
        success: false,
        message: "Documents verification failed"
      });
    }

    // ✅ SUCCESS
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