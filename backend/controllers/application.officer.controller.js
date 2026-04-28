// controllers/application.officer.controller.js

import Application from "../models/Application.js";
import { generateApplicationNumber } from "../utils/generateApplicationNumber.js";

// ✅ SUBMIT APPLICATION
export const submitApplication = async (req, res) => {
  try {
    const formData = req.body;

    // 🔹 SAFE EXTRACTION (VERY IMPORTANT ORDER)
    const categoryDetails = formData.categoryDetails || {};
    const edu = formData.educationalParticulars || {};
    const shift = formData.shiftDetails || {};
    const study = formData.studyEligibility || {};

    const shiftType = shift.shiftType;
    const category = categoryDetails.category;
    const sslc = edu.sslcRegisterNumber;

    // 🔹 REQUIRED VALIDATION
    if (!sslc) {
      return res.status(400).json({ message: "SSLC Register Number is required" });
    }

    if (!formData.basicDetails?.motherName || !formData.basicDetails?.fatherName) {
      return res.status(400).json({ message: "Mother and Father name are required" });
    }

    // 🔹 DUPLICATE CHECK
    const existing = await Application.findOne({
      "educationalParticulars.sslcRegisterNumber": sslc
    });

    if (existing) {
      return res.status(400).json({
        message: "Application already exists for this SSLC number"
      });
    }

    // 🔹 CATEGORY DEFAULT
   // 🔹 CATEGORY DEFAULT
if (!categoryDetails.hasCertificate) {
  categoryDetails.hasCertificate = "No";
}

// 🔹 HANDLE CATEGORY LOGIC
if (categoryDetails.hasCertificate === "Yes") {
  delete categoryDetails.hasAcknowledgement;
  delete categoryDetails.acknowledgementNumber;
} else {
  // hasCertificate === "No"
  if (!categoryDetails.hasAcknowledgement) {
    return res.status(400).json({
      message: "Please specify acknowledgement status"
    });
  }

  if (
    categoryDetails.hasAcknowledgement === "Yes" &&
    !categoryDetails.acknowledgementNumber
  ) {
    return res.status(400).json({
      message: "Acknowledgement number is required"
    });
  }
}
    // 🔹 CONVERT NUMBERS (VERY IMPORTANT)
    edu.sslcMaxMarks = Number(edu.sslcMaxMarks);
    edu.sslcObtainedMarks = Number(edu.sslcObtainedMarks);
    edu.maxScienceMarks = Number(edu.maxScienceMarks);
    edu.obtainedScienceMarks = Number(edu.obtainedScienceMarks);
    edu.maxMathsMarks = Number(edu.maxMathsMarks);
    edu.obtainedMathsMarks = Number(edu.obtainedMathsMarks);
    edu.totalMaxScienceMaths = Number(edu.totalMaxScienceMaths);
    edu.totalObtainedScienceMaths = Number(edu.totalObtainedScienceMaths);

    categoryDetails.annualIncome = Number(categoryDetails.annualIncome);

    study.yearsStudiedInKarnataka = Number(study.yearsStudiedInKarnataka) || 0;

    shift.experienceYears = Number(shift.experienceYears) || 0;
    shift.experienceMonths = Number(shift.experienceMonths) || 0;

    // 🔹 DOB CONVERSION
    if (formData.basicDetails?.dob) {
      const parts = formData.basicDetails.dob.split("-");
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        formData.basicDetails.dob = new Date(`${yyyy}-${mm}-${dd}`);
      }
    }

    // 🔹 GENERATE APPLICATION NUMBER
    const applicationNumber = await generateApplicationNumber(shiftType, category);

    // 🔹 EXAM LOGIC
    const getExamDetails = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);

      const start1 = new Date("2026-04-26");
      const end1 = new Date("2026-05-05");

      const start2 = new Date("2026-05-06");
      const end2 = new Date("2026-05-11");

      start1.setHours(0, 0, 0, 0);
      end1.setHours(0, 0, 0, 0);
      start2.setHours(0, 0, 0, 0);
      end2.setHours(0, 0, 0, 0);

      if (d >= start1 && d <= end1) {
        return { examDate: "06-05-2026", examTime: "10:00 AM" };
      }

      if (d >= start2 && d <= end2) {
        return { examDate: "13-05-2026", examTime: "10:00 AM" };
      }

      return { examDate: "Not Assigned", examTime: "-" };
    };

    const examDetails = getExamDetails(new Date());

    // 🔹 CREATE APPLICATION
    const application = new Application({
      ...formData,

      categoryDetails,
      educationalParticulars: edu,
      shiftDetails: shift,
      studyEligibility: study,

      applicationNumber,
      examDetails,

      createdBy: {
        clerkId: req.auth?.userId,
        name: req.auth?.sessionClaims?.name || "Officer"
      },

      status: "SUBMITTED"
    });

    await application.save();

    return res.status(201).json({
      message: "Application submitted successfully",
      applicationNumber,
      sslc
    });

  } catch (error) {
    console.error("FULL ERROR:", error);
    console.error("BODY:", req.body);

    return res.status(500).json({
      message: error.message
    });
  }
};
// 🔍 ADVANCED SEARCH (TABLE VIEW)
export const searchApplications = async (req, res) => {
  try {
    const {
      name,
      fatherName,
      mobile,
      sslc,
      fromDate,
      toDate
    } = req.query;

    let query = {};

    // 🔹 TEXT SEARCH
    if (name) {
      query["basicDetails.name"] = { $regex: name, $options: "i" };
    }

    if (fatherName) {
      query["basicDetails.fatherName"] = { $regex: fatherName, $options: "i" };
    }

    if (mobile) {
      query["contactDetails.mobile"] = mobile;
    }

    if (sslc) {
      query["educationalParticulars.sslcRegisterNumber"] = sslc;
    }

    // 🔹 DATE FILTER
    if (fromDate || toDate) {
      query.submittedAt = {};

      if (fromDate) {
        query.submittedAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        query.submittedAt.$lte = new Date(toDate);
      }
    }

    const applications = await Application.find(query)
      .sort({ submittedAt: -1 })
      .select({
        applicationNumber: 1,
        "basicDetails.name": 1,
        "basicDetails.fatherName": 1,
        "contactDetails.mobile": 1,
        "educationalParticulars.sslcRegisterNumber": 1,
        submittedAt: 1
      });

    res.json(applications);

  } catch (error) {
    console.error("SEARCH ERROR:", error);
    res.status(500).json({ message: "Search failed" });
  }
};
// 🔍 SEARCH BY SSLC
export const getBySSLC = async (req, res) => {
  try {
    const { sslc } = req.query;

    if (!sslc) {
      return res.status(400).json({
        message: "SSLC number is required"
      });
    }

    const application = await Application.findOne({
      "educationalParticulars.sslcRegisterNumber": sslc
    }).sort({ createdAt: -1 });

    if (!application) {
      return res.status(404).json({
        message: "Application not found"
      });
    }

    res.json(application);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error searching application"
    });
  }
};

// ✅ UPDATE APPLICATION
export const updateApplication = async (req, res) => {
  try {
    const { sslc } = req.params;
    const formData = req.body;

    const existing = await Application.findOne({
      "educationalParticulars.sslcRegisterNumber": sslc
    });

    if (!existing) {
      return res.status(404).json({
        message: "Application not found"
      });
    }

    // 🔹 VALIDATION
    if (!formData.basicDetails?.motherName || !formData.basicDetails?.fatherName) {
      return res.status(400).json({
        message: "Mother and Father name are required"
      });
    }

    // 🔹 DOB FIX
    if (formData.basicDetails?.dob) {
      const parts = formData.basicDetails.dob.split("-");
      if (parts.length === 3) {
        const [dd, mm, yyyy] = parts;
        formData.basicDetails.dob = new Date(`${yyyy}-${mm}-${dd}`);
      }
    }

    // 🔹 SAFE UPDATE
    const updated = await Application.findOneAndUpdate(
      { "educationalParticulars.sslcRegisterNumber": sslc },
      {
        basicDetails: formData.basicDetails,
        qualifyingDetails: formData.qualifyingDetails,
        studyEligibility: formData.studyEligibility,
        exemptionClaims: formData.exemptionClaims,
        specialCategory: formData.specialCategory,
        shiftDetails: formData.shiftDetails,
        categoryDetails: formData.categoryDetails,
        contactDetails: formData.contactDetails,
        educationalParticulars: formData.educationalParticulars,
        declaration: formData.declaration
      },
      { new: true }
    );

    res.json({
      message: "Application updated successfully",
      data: updated
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Update failed"
    });
  }
};