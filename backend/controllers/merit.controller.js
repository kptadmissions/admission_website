import Application from "../models/application.model.js";

/* =========================================
   GENERATE MERIT LIST
========================================= */
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

    // Merit = SSLC %
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
      message: "Merit list generated successfully",
      totalStudents: scored.length,
    });
  } catch (err) {
    console.error("Merit generation failed:", err);
    res.status(500).json({
      message: err.message || "Merit generation failed",
    });
  }
};

/* =========================================
   GET MERIT LIST
========================================= */
export const getMeritList = async (req, res) => {
  try {
    const meritList = await Application.find({
      status: "MERIT_GENERATED",
    })
      .sort({ rank: 1 })
      .select(
        "applicationNumber name branch rank meritScore academicDetails.sslcPercentage category"
      );

    res.json({
      success: true,
      count: meritList.length,
      meritList,
    });
  } catch (err) {
    res.status(500).json({
      message: "Failed to fetch merit list",
    });
  }
};