// controllers/application.officer.controller.js

import Application from "../models/Application.js";
import { generateApplicationNumber } from "../utils/generateApplicationNumber.js";

// ✅ SUBMIT FORM (Officer)
export const submitApplication = async (req, res) => {
  try {
    const formData = req.body;

    const shiftType = formData.shiftDetails.shiftType;
    const category = formData.categoryDetails.category;
    const sslc = formData.educationalParticulars.sslcRegisterNumber;

    // 🔥 Duplicate check
    const existing = await Application.findOne({
      "educationalParticulars.sslcRegisterNumber": sslc
    });
    if (!formData.basicDetails?.motherName || !formData.basicDetails?.fatherName) {
  return res.status(400).json({
    message: "Mother and Father name are required"
  });
}

    if (existing) {
      return res.status(400).json({
        message: "Application already exists for this SSLC number"
      });
    }

    // 🔥 Convert DOB
    if (formData.basicDetails?.dob) {
      const [dd, mm, yyyy] = formData.basicDetails.dob.split("-");
      formData.basicDetails.dob = new Date(`${yyyy}-${mm}-${dd}`);
    }

    // 🔥 Generate number
   // 🔥 Generate number
const applicationNumber = await generateApplicationNumber(
  shiftType,
  category
);

// 🔥 Exam logic
const getExamDetails = (date) => {
  const d = new Date(date);
  d.setHours(0,0,0,0);

  const start1 = new Date("2026-04-26");
  const end1 = new Date("2026-05-05");

  const start2 = new Date("2026-05-06");
  const end2 = new Date("2026-05-11");

  start1.setHours(0,0,0,0);
  end1.setHours(0,0,0,0);
  start2.setHours(0,0,0,0);
  end2.setHours(0,0,0,0);

  if (d >= start1 && d <= end1) {
    return { examDate: "07-05-2026", examTime: "10:00 AM" };
  }

  if (d >= start2 && d <= end2) {
    return { examDate: "13-05-2026", examTime: "10:00 AM" };
  }

  return { examDate: "Not Assigned", examTime: "-" };
};
// ✅ CREATE examDetails
const examDetails = getExamDetails(formData.submittedAt || new Date());

// ✅ Save
const application = new Application({
  basicDetails: {
  ...formData.basicDetails,
  motherName: formData.basicDetails?.motherName,
  fatherName: formData.basicDetails?.fatherName
},
  applicationNumber,
  examDetails, // ✅ now correct
  createdBy: {
    clerkId: req.auth.userId,
    name: req.auth.sessionClaims?.name || "Officer"
  },
  status: "SUBMITTED"
});

    await application.save();

    res.status(201).json({
      message: "Application submitted successfully",
      applicationNumber: application.applicationNumber,
      sslc
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Submission failed"
    });
  }
};
// 🔍 Search by SSLC Register Number
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
    res.status(500).json({ message: "Error searching application" });
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
      return res.status(404).json({ message: "Application not found" });
    }

    // 🔥 Validation
    if (!formData.basicDetails?.motherName || !formData.basicDetails?.fatherName) {
      return res.status(400).json({
        message: "Mother and Father name are required"
      });
    }

    // 🔥 Convert DOB
    if (formData.basicDetails?.dob) {
      const [dd, mm, yyyy] = formData.basicDetails.dob.split("-");
      formData.basicDetails.dob = new Date(`${yyyy}-${mm}-${dd}`);
    }

    // 🔥 SAFE UPDATE (no blind spread)
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
    res.status(500).json({ message: "Update failed" });
  }
};