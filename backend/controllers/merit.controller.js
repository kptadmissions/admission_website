import Application from "../models/application.model.js";

export const generateMeritList = async (req, res) => {
  try {
    const applications = await Application.find({
      status: "VERIFIED",
    });

    if (!applications.length) {
      return res
        .status(400)
        .json({ message: "No verified applications found" });
    }

    // 🔥 NO BONUS — ONLY SSLC %
    const scored = applications.map((app) => {
      const percentage = app.academicDetails?.sslcPercentage || 0;

      return {
        app,
        meritScore: percentage,
      };
    });

    // Sort descending
    scored.sort((a, b) => b.meritScore - a.meritScore);

    // Assign ranks
    for (let i = 0; i < scored.length; i++) {
      const application = scored[i].app;
      application.rank = i + 1;
      application.meritScore = scored[i].meritScore;
      application.status = "MERIT_GENERATED";
      await application.save();
    }

    res.json({
      success: true,
      message: "Merit list generated successfully (No Bonus Applied)",
      totalStudents: scored.length,
    });
  } catch (err) {
    console.error("❌ Merit generation failed:", err);
    res.status(500).json({
      message: err.message || "Merit generation failed",
    });
  }
};