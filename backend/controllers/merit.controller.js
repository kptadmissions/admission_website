import Application from "../models/application.model.js";
import AdmissionSettings from "../models/AdmissionSettings.js";

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
      application.status = "MERIT_GENERATED";

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

// =========================================
// START PHYSICAL VERIFICATION
// =========================================
export const startPhysicalVerification = async (req, res) => {
  try {
    const settings = await AdmissionSettings.findOne();
const activeType = settings.normalActive ? "NORMAL" : "LATERAL";

await Application.updateMany(
  { 
    status: "MERIT_GENERATED",
    admissionType: activeType   // ✅ ADD THIS
  },
  { status: "PHYSICAL_VERIFICATION_PENDING" }
);

    res.json({
      success: true,
      message: "Moved to Physical Verification"
    });

  } catch (err) {
    res.status(500).json({ message: "Failed to move students" });
  }
};