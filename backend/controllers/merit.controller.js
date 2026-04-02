import Application from "../models/application.model.js";
import AdmissionSettings from "../models/AdmissionSettings.js";

/* =========================================
   GENERATE MERIT LIST
========================================= */
export const generateMeritList = async (req, res) => {
  try {
    const settings = await AdmissionSettings.findOne();

    let activeType = settings.normalActive ? "NORMAL" : "LATERAL";

    const applications = await Application.find({
      status: "VERIFIED",
      admissionType: activeType
    });

    if (!applications.length) {
      return res.status(400).json({ message: "No verified applications found" });
    }

    const scored = applications.map(app => ({
      app,
      meritScore: app.academicDetails?.sslcPercentage || 0
    }));

    // Sort + tie breaker
    scored.sort((a, b) => {
      if (b.meritScore !== a.meritScore)
        return b.meritScore - a.meritScore;

      return (b.app.academicDetails?.sslcMathsMarks || 0) -
             (a.app.academicDetails?.sslcMathsMarks || 0);
    });

    for (let i = 0; i < scored.length; i++) {
  const application = scored[i].app;

  application.rank = i + 1;
  application.meritScore = scored[i].meritScore;

  // ✅ DIRECT MOVE TO VERIFICATION
  application.status = "PHYSICAL_VERIFICATION_PENDING";

  await application.save();
}

    res.json({
      success: true,
      message: "Merit list generated"
    });

  } catch (err) {
    res.status(500).json({ message: "Merit generation failed" });
  }
};

/* =========================================
   GET MERIT LIST  ✅ (THIS WAS MISSING)
========================================= */
export const getMeritList = async (req, res) => {
  try {
    const settings = await AdmissionSettings.findOne();
    const activeType = settings.normalActive ? "NORMAL" : "LATERAL";

    const meritList = await Application.find({
      status: "MERIT_GENERATED",
      admissionType: activeType
    })
      .sort({ rank: 1 })
      .select(
        "rank meritScore personalDetails.name categoryDetails.category academicDetails.sslcPercentage"
      );

    res.json({
      success: true,
      meritList
    });

  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch merit list"
    });
  }
};

/* =========================================
   START PHYSICAL VERIFICATION
========================================= */
export const startPhysicalVerification = async (req, res) => {
  try {
    const settings = await AdmissionSettings.findOne();

    let activeType = null;
    if (settings.normalActive) activeType = "NORMAL";
    if (settings.lateralActive) activeType = "LATERAL";

    const result = await Application.updateMany(
      { 
        status: "MERIT_GENERATED",
        admissionType: { $regex: new RegExp(`^${activeType}$`, "i") }
      },
      { status: "PHYSICAL_VERIFICATION_PENDING" }
    );

    console.log("Updated:", result.modifiedCount);

    res.json({
      success: true,
      message: `Moved ${result.modifiedCount} students`
    });

  } catch (err) {
    res.status(500).json({ message: "Failed" });
  }
};