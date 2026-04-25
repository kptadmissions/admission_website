import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({

/* =========================
1. BASIC
========================= */

studentClerkId:{
  type:String,
  required:true,
  index:true
},

admissionYear:{
  type:String,
  default:"2025-26",
  required:true
},

admissionType:{
  type:String,
  enum:["NORMAL","LATERAL"],
  required:true
},

/* =========================
2. PERSONAL DETAILS
========================= */

personalDetails:{
  name:{type:String,required:true},
  fatherName:String,
  motherName:String,
  dob:Date,

  gender:String,
  religion:String,

  nationality:{type:String,default:"INDIAN"},

  mobile:{ type:String, match:/^[0-9]{10}$/ },

  email:String,

  address:String,
  district:String,
  state:{type:String,default:"Karnataka"},

  pincode:{ type:String, match:/^[0-9]{6}$/ },

  satsNumber:String,

  aadharNumber:{ type:String, match:/^[0-9]{12}$/ },

  motherTongue:String,
  nativeState:String,
  nativeDistrict:String,

  photo:{ type:String, required:true }
},

/* =========================
3. ACADEMIC
========================= */

academicDetails:{
  board:String,
  sslcRegisterNumber:String,
  sslcPassingYear:String,

  sslcMaxMarks:Number,
  sslcObtainedMarks:Number,
  sslcPercentage:Number,

  sslcScienceMarks:Number,
  sslcMathsMarks:Number,

  qualifyingExam:String,
  itiTrade:String,
  yearsStudiedInKarnataka:String,
  stateAppearedForQualifyingExam:String,

  itiPucRegisterNumber:String,
  itiPucPassingYear:String,
  itiPucMaxMarks:Number,
  itiPucObtainedMarks:Number,
  itiPucPercentage:Number
},

/* =========================
4. CATEGORY
========================= */

categoryDetails:{
  category:{
    type:String,
    enum:[
      "GM",
      "SC - Category A",
      "SC - Category B",
      "SC - Category C",
      "ST",
      "Cat-1",
      "2A",
      "2B",
      "3A",
      "3B"
    ],
    default:"GM"
  },
  casteName:String,
  annualIncome:Number,

  isRural:{type:Boolean,default:false},
  isKannadaMedium:{type:Boolean,default:false},
  isStudyCertificateExempt:{type:Boolean,default:false}
},
studyDetails: [
  {
    level: String,
    academicYear: String,
    schoolName: String,
    district: String,
    state: String,
    source: String
  }
],
/* =========================
5. BRANCH
========================= */

branchPreferences:{
  type:[String],
  validate:[arr => arr.length <= 5,"Maximum 5 branches allowed"]
},

/* =========================
6. DOCUMENTS
========================= */

documents:{
  candidateSignature:String,
  parentSignature:String,

  // ✅ CRITICAL DOCUMENTS
  sslcMarksCard:String,
  aadhaarCard:String,
  transferCertificate:String,        // ✅ NEW (TC)
  studyCertificate:String,           // ✅ NEW (7 years study)

  // OPTIONAL ACADEMIC
  itiMarksCard:String,
  pucMarksCard:String,

  // ✅ RESERVATION DOCUMENTS
  casteCertificate:String,
  incomeCertificate:String,
  ruralCertificate:String,
  kannadaCertificate:String,

  // OPTIONAL
  studyExemptionCertificate:String
},

/* =========================
7. MERIT + SEAT
========================= */

meritScore:Number,
rank:Number,
allottedBranch:String,

studentResponse:{
  type:String,
  enum:["PENDING","ACCEPTED","REJECTED","UPGRADE_REQUESTED"],
  default:"PENDING"
},

seatLocked:{type:Boolean,default:false},

/* =========================
8. VERIFICATION
========================= */

verification:{
  verifiedBy:String,
  verifiedAt:Date,
  remarks:String
},

physicalVerification:{
  verified:{type:Boolean,default:null},
  verifiedBy:String,
  verifiedAt:Date,
  remarks:String
},
examDetails: {
  attended: { type: Boolean, default: false },
  score: Number,
  totalQuestions: Number,
  percentage: Number
},
/* =========================
9. STATUS
========================= */

status:{
  type:String,
  enum:[
    "DRAFT",
    "SUBMITTED",

    "UNDER_VERIFICATION",
    "CORRECTION_REQUIRED",
    "REJECTED",

    "VERIFIED",
    "MERIT_GENERATED",

    "SEAT_ALLOTTED",
    "SEAT_ACCEPTED",
    "ADMITTED"
  ],
  default:"DRAFT"
},

remarks:{type:String,default:""}

},{timestamps:true});

/* INDEXES */

applicationSchema.index({ studentClerkId:1, admissionYear:1 },{ unique:true });
applicationSchema.index({ status:1 });

export default mongoose.model("Application",applicationSchema);