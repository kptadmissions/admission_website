import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  
  // 🔹 CREATED BY (ALREADY EXISTS)
  createdBy: {
    clerkId: { type: String, required: true },
    name: String,
    role: { type: String, default: "verification_officer" }
  },

  // ✅ NEW: EDITED BY
  editedBy: {
    clerkId: { type: String },
    name: String,
    role: String,
    editedAt: Date
  },

  // 🔹 APPLICATION NUMBER
  applicationNumber: {
    type: String,
    unique: true,
    required: true
  },

  // 🔹 STATUS FLOW
  status: {
    type: String,
    enum: ["DRAFT", "SUBMITTED", "VERIFIED", "REJECTED"],
    default: "SUBMITTED"
  },

  remarks: String,

  // ================================
  // 1. BASIC DETAILS (STUDENT DATA)
  // ================================
  basicDetails: {
    satsNumber: String,
    aadharNumber: {
      type: String,
      required: true,
      match: /^\d{12}$/
    },
    name: String,
    motherName: String,
    fatherName: String,
    dob: Date,
    gender: String,
    nationality: String,
    religion: String
  },

  // ================================
  // 2. QUALIFYING DETAILS
  // ================================
  qualifyingDetails: {
    qualifyingExam: String,
    nativeState: String,
    nativeDistrict: String
  },

  // ================================
  // 3. STUDY & ELIGIBILITY
  // ================================
  studyEligibility: {
    stateAppearedForQualifyingExam: String,
    yearsStudiedInKarnataka: Number,
    isRural: String,
    isKannadaMedium: String
  },

  // ================================
  // 4. EXEMPTION CLAIMS
  // ================================
  exemptionClaims: {
    isFiveYearExemption: String,
    exemptionClause: String,
    isHyderabadKarnataka: String,
    isSNQ: String
  },

  // ================================
  // 5. SPECIAL CATEGORY
  // ================================
  specialCategory: {
    JTS: Boolean,
    JOC: Boolean,
    EDP: Boolean,
    DP: Boolean,
    PS: Boolean,
    SP: Boolean,
    SG: Boolean,
    AI: Boolean,
    CI: Boolean,
    GK: Boolean,
    ITI: Boolean,
    NCC: Boolean,
    PH: Boolean
  },

  // ================================
  // 6. SHIFT DETAILS
  // ================================
  shiftDetails: {
    shiftType: String,
    experienceYears: Number,
    experienceMonths: Number,
    serviceCertificate: String
  },

  // ================================
  // 7. CATEGORY DETAILS
  // ================================
  categoryDetails: {
    hasCertificate: {
      type: String,
      enum: ["Yes", "No"]
    },
    hasAcknowledgement: {
      type: String,
      enum: ["Yes", "No"]
    },
    acknowledgementNumber: String,
    category: String,
    casteName: String,
    annualIncome: Number
  },

  // 8. CONTACT DETAILS
  // ================================
  contactDetails: {
    mobile: String,
    parentMobile: String,
    email: String,
    address: String,
    state: String,
    district: String,
    pincode: String
  },

  // ================================
  // 9. EDUCATIONAL DETAILS
  // ================================
  educationalParticulars: {
    sslcRegisterNumber: String,
    sslcPassingYear: String,

    sslcMaxMarks: Number,
    sslcObtainedMarks: Number,

    maxScienceMarks: Number,
    obtainedScienceMarks: Number,

    maxMathsMarks: Number,
    obtainedMathsMarks: Number,

    totalMaxScienceMaths: Number,
    totalObtainedScienceMaths: Number
  },

  // ================================
  // 10. DECLARATION
  // ================================
  declaration: {
    candidateSignatureText: String,
    parentSignatureText: String
  },
  
  examDetails: {
    examDate: String,
    examTime: String,
    examCenter: {
      type: String,
      default: "KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE"
    }
  },
  // 🔹 ACKNOWLEDGEMENT META
  submittedAt: {
    type: Date,
    default: Date.now
  }

}, { timestamps: true });

applicationSchema.index({
  "educationalParticulars.sslcRegisterNumber": 1
});

export default mongoose.model("ApplicationByOfficer", applicationSchema);