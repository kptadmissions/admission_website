// src/pages/verification/ApplicationForm.jsx

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
User, MapPin, BookOpen, Layers, CheckCircle, AlertCircle, XCircle
} from "lucide-react"; 
import FullPageLoader from "../../components/FullPageLoader";

// --- CONFIGURATION ---
const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "Other"];
const CATEGORIES = [
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
];
const EXEMPTION_CLAUSES = ["A", "B", "C", "D", "E", "F", "G"];
const SPECIAL_CATEGORIES_LIST = ["JTS", "JOC", "EDP", "DP", "PS", "SP", "SG", "AI", "CI", "GK", "ITI", "NCC", "PH"];

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));

const STATES = [
"Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana",
"Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
"Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
"Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
"Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const KARNATAKA_DISTRICTS = [
"Bagalkot","Ballari","Belagavi","Bengaluru Rural","Bengaluru Urban",
"Bidar","Chamarajanagar","Chikkaballapur","Chikkamagaluru","Chitradurga",
"Dakshina Kannada","Davanagere","Dharwad","Gadag","Hassan",
"Haveri","Kalaburagi","Kodagu","Kolar","Koppal",
"Mandya","Mysuru","Raichur","Ramanagara","Shivamogga",
"Tumakuru","Udupi","Uttara Kannada","Vijayapura","Yadgir"
];

const EMPTY_FORM = {
basicDetails: {
    satsNumber: "", aadharNumber: "", name: "", motherName: "", fatherName: "",
    dob: "", gender: "", nationality: "Yes", religion: ""
},
qualifyingDetails: {
    qualifyingExam: "", nativeState: "Karnataka", nativeDistrict: ""
},
studyEligibility: {
    stateAppearedForQualifyingExam: "Karnataka", yearsStudiedInKarnataka: "",
    isRural: "No", isKannadaMedium: "No"
},
exemptionClaims: {
    isFiveYearExemption: "No", exemptionClause: "",
    isHyderabadKarnataka: "No", isSNQ: "No"
},
specialCategory: {
    JTS: false, JOC: false, EDP: false, DP: false, PS: false, SP: false, SG: false,
    AI: false, CI: false, GK: false, ITI: false, NCC: false, PH: false
},
shiftDetails: {
    shiftType: "Day Shift", experienceYears: "", experienceMonths: "", serviceCertificate: "No"
},
categoryDetails: {
    hasCertificate: "", hasAcknowledgement: "", acknowledgementNumber: "",
    category: "GM", casteName: "", annualIncome: ""
},
contactDetails: {
    mobile: "", parentMobile: "", email: "",
    address: "", state: "Karnataka", district: "", pincode: ""
},
educationalParticulars: {
    sslcRegisterNumber: "", sslcPassingYear: "",
    sslcMaxMarks: "", sslcObtainedMarks: "",
    maxScienceMarks: "", obtainedScienceMarks: "",
    maxMathsMarks: "", obtainedMathsMarks: "",
    totalMaxScienceMaths: "", totalObtainedScienceMaths: ""
},
declaration: {
    candidateSignatureText: "", parentSignatureText: ""
}
};

const isEmpty = (value) => value === undefined || value === null || value.toString().trim() === "";

// --- HELPER COMPONENTS ---
const InputGroup = ({ id, name, label, value, onChange, type = "text", placeholder, required = true, disabled = false, className = "", maxLength, onPaste }) => (
<div className={`flex flex-col ${className}`}>
    <label htmlFor={id} className="text-xs font-bold text-slate-500 mb-1">
    {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
    id={id} name={name} type={type} value={value ?? ""} onChange={onChange}
    placeholder={placeholder} maxLength={maxLength} onPaste={onPaste} disabled={disabled}
    autoComplete="on"
    className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
    />
</div>
);

const SelectGroup = ({ id, name, label, value, onChange, options, disabled = false, required = true, className = "" }) => (
<div className={`flex flex-col ${className}`}>
    <label htmlFor={id} className="text-xs font-bold mb-1 text-slate-500">
    {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
    id={id} name={name} value={value ?? ""} onChange={onChange} disabled={disabled}
    className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500"
    >
    <option value="">Select</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
</div>
);

const SectionHeader = ({ icon: Icon, title, subtitle }) => (
<div className="flex items-center gap-2 mb-6 mt-8 pb-2 border-b-2 border-slate-100">
    <div className="bg-blue-100 p-1.5 rounded-md">
    {Icon && <Icon className="w-5 h-5 text-blue-700" />}
    </div>
    <div>
    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
    {subtitle && <p className="text-xs font-medium text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
</div>
);

// --- MAIN COMPONENT ---
export default function AdmissionForm() {
const { getToken } = useAuth();

const [admissionsClosed, setAdmissionsClosed] = useState(false);
const [form, setForm] = useState(null);
const [status, setStatus] = useState("NEW");
const [remarks, setRemarks] = useState("");
const [editable, setEditable] = useState(true);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [declarationChecked, setDeclarationChecked] = useState(false);

useEffect(() => {
const init = async () => {
    try {
    const settingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/admission/settings`);
    const { normalActive, lateralActive } = settingsRes.data;

    if (!normalActive && !lateralActive) {
        setAdmissionsClosed(true);
        return;
    }

    const initialForm = JSON.parse(JSON.stringify(EMPTY_FORM));
    setForm(initialForm);
    setEditable(true);

    } catch (error) {
    toast.error("Failed to load form.");
    } finally {
    setLoading(false);
    }
};

init();
}, []);

// Auto Calculation Effect
useEffect(() => {
    if (!form) return;
    const maxSci = Number(form.educationalParticulars.maxScienceMarks) || 0;
    const maxMath = Number(form.educationalParticulars.maxMathsMarks) || 0;
    const obtSci = Number(form.educationalParticulars.obtainedScienceMarks) || 0;
    const obtMath = Number(form.educationalParticulars.obtainedMathsMarks) || 0;

    const calcTotalMax = maxSci + maxMath;
    const calcTotalObt = obtSci + obtMath;

    const strTotalMax = calcTotalMax > 0 ? calcTotalMax.toString() : "";
    const strTotalObt = (calcTotalObt > 0 || (obtSci === 0 && obtMath === 0 && calcTotalMax > 0)) ? calcTotalObt.toString() : "";

    if (
    form.educationalParticulars.totalMaxScienceMaths !== strTotalMax ||
    form.educationalParticulars.totalObtainedScienceMaths !== strTotalObt
    ) {
    setForm(prev => ({
        ...prev,
        educationalParticulars: {
        ...prev.educationalParticulars,
        totalMaxScienceMaths: strTotalMax,
        totalObtainedScienceMaths: strTotalObt
        }
    }));
    }
}, [
    form?.educationalParticulars.maxScienceMarks,
    form?.educationalParticulars.maxMathsMarks,
    form?.educationalParticulars.obtainedScienceMarks,
    form?.educationalParticulars.obtainedMathsMarks
]);

// AUTO-FILL SIGNATURE SECTION LOGIC
useEffect(() => {
    if (!form) return;
    setForm(prev => ({
        ...prev,
        declaration: {
            ...prev.declaration,
            candidateSignatureText: prev.basicDetails.name,
            parentSignatureText: prev.basicDetails.fatherName
        }
    }));
}, [form?.basicDetails.name, form?.basicDetails.fatherName]);

const update = (section, field, value) => {
setForm(prev => {
    const updatedSection = {
    ...prev[section],
    [field]: value
    };

    return {
    ...prev,
    [section]: updatedSection
    };
});
};
const toggleCheck = (section, field) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: !prev[section][field] } }));
};

const validateForm = () => {
    console.log("=== STARTING FORM VALIDATION ===");
    const { basicDetails, contactDetails, educationalParticulars, declaration } = form;

    // Helper to ensure user ALWAYS sees the error, even if toast fails
    const showError = (msg) => {
      console.warn("[Validation Failed]:", msg);
      try { 
        toast.error(msg); 
      } catch (e) { 
        alert(`Validation Error: ${msg}`); 
      }
    };

    const requiredBasic = ["aadharNumber", "name", "dob", "gender", "religion"];
    for (let field of requiredBasic) {
      if (isEmpty(basicDetails[field])) { 
        showError(`Please fill basic detail: ${field}`); 
        return false; 
      }
    }

    if (basicDetails.aadharNumber?.length !== 12) { 
      showError("Aadhaar Number must be exactly 12 digits"); 
      return false; 
    }
    
    if (!/^\d{2}-\d{2}-\d{4}$/.test(basicDetails.dob)) {
      showError("Date of Birth must be complete (DD, MM, and 4-digit YYYY)"); 
      return false;
    }

    if (isEmpty(contactDetails.mobile) || contactDetails.mobile.length !== 10) { 
      showError("Student Mobile Number must be exactly 10 digits"); 
      return false; 
    }
    if (isEmpty(contactDetails.parentMobile) || contactDetails.parentMobile.length !== 10) { 
      showError("Parent Mobile Number must be exactly 10 digits"); 
      return false; 
    }
    if (isEmpty(contactDetails.pincode) || contactDetails.pincode.length !== 6) { 
      showError("Pincode must be exactly 6 digits"); 
      return false; 
    }

    const sslcFields = [
      'sslcRegisterNumber', 'sslcPassingYear', 'sslcMaxMarks', 'sslcObtainedMarks', 
      'maxScienceMarks', 'obtainedScienceMarks', 'maxMathsMarks', 'obtainedMathsMarks'
    ];
    for (let field of sslcFields) {
      if (isEmpty(educationalParticulars[field])) { 
        showError(`Please fill SSLC mark details: ${field.replace(/([A-Z])/g, ' $1').trim()}`); 
        return false; 
      }
    }

    if (Number(educationalParticulars.sslcObtainedMarks) > Number(educationalParticulars.sslcMaxMarks)) {
      showError("Total Obtained marks cannot be greater than Total Max marks"); 
      return false;
    }
    if (Number(educationalParticulars.obtainedScienceMarks) > Number(educationalParticulars.maxScienceMarks)) {
      showError("Science Obtained marks cannot be greater than Science Max marks"); 
      return false;
    }
    if (Number(educationalParticulars.obtainedMathsMarks) > Number(educationalParticulars.maxMathsMarks)) {
      showError("Maths Obtained marks cannot be greater than Maths Max marks"); 
      return false;
    }

    if (isEmpty(declaration.candidateSignatureText) || isEmpty(declaration.parentSignatureText)) {
      showError("Please provide both signatures in the declaration section"); 
      return false;
    }

    if (!declarationChecked) { 
      showError("You must accept the declaration."); 
      return false; 
    }

    console.log("=== VALIDATION PASSED ===");
    return true;
  };

const submit = async () => {
  console.log("🔥 Submit clicked");

  // FORCE UI RESPONSE IMMEDIATELY
  setSubmitting(true);

  try {
    const isValid = validateForm();

    if (!isValid) {
      console.warn("❌ Validation failed");
      alert("Please fill all required fields correctly"); // fallback
      setSubmitting(false);
      return;
    }

    const token = await getToken();

    if (!token) {
      alert("Authentication failed. Please login again.");
      setSubmitting(false);
      return;
    }

    console.log("✅ Token:", token);
    console.log("📤 Sending data:", form);
    console.log("🌐 API:", `${import.meta.env.VITE_API_URL}/applications/submit`);

    const res = await axios.post(
      `${import.meta.env.VITE_API_URL}/applications/submit`,
      form,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    console.log("✅ Response:", res.data);

    toast.success("Application Submitted Successfully!");
    alert("Application Submitted Successfully!"); // fallback

    const newForm = JSON.parse(JSON.stringify(EMPTY_FORM));
    setForm(newForm);
    setDeclarationChecked(false);

  } catch (e) {
    console.error("💥 ERROR:", e);

    let msg = "Submission failed";

    if (e.response) {
      msg = e.response.data?.message || "Server error";
    } else if (e.request) {
      msg = "No response from server";
    } else {
      msg = e.message;
    }

    toast.error(msg);
    alert(msg); // fallback

  } finally {
    setSubmitting(false);
  }
};
if (loading) return <FullPageLoader label="Loading admission form..." />;
if (admissionsClosed) {
    return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-xl shadow-2xl text-center border-t-4 border-red-500 max-w-lg w-full">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Admissions Closed</h1>
        <p className="text-slate-500">Admissions are currently closed.</p>
        </div>
    </div>
    );
}

if (!form) return null;

const dobParts = form.basicDetails.dob ? form.basicDetails.dob.split("-") : ["", "", ""];
const dobD = dobParts[0] || "";
const dobM = dobParts[1] || "";
const dobY = dobParts[2] || "";

const updateDob = (d, m, y) => update("basicDetails", "dob", `${d}-${m}-${y}`);

return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 font-sans">
    <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200">
        
        {/* HEADER */}
        <div className="bg-blue-900 p-6 text-white border-b-4 border-yellow-500 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl shadow-lg">K</div>
            <div>
            <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">Application Form Page</h1>
           <p className="text-blue-200 text-sm md:text-base">Admissions 2026</p>
            </div>
        </div>
        <div className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg ${
            status === "SUBMITTED" ? "bg-green-500 text-white" : status === "CORRECTION_REQUIRED" ? "bg-red-500 text-white" : "bg-white text-blue-900"
        }`}>Status: {status.replace("_", " ")}</div>
        </div>

        {remarks && editable && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 m-6 mb-0 text-red-800 flex items-start gap-3 rounded-r">
            <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div><p className="font-bold text-sm uppercase">Correction Required</p><p className="text-sm">{remarks}</p></div>
        </div>
        )}

        <div className="p-6 md:p-10">
        
        {/* 1. BASIC DETAILS */}
        <SectionHeader icon={User} title="Basic Details" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <InputGroup id="satsNumber" name="satsNumber" label="1. SATS NO" value={form.basicDetails.satsNumber ?? ""} onChange={(e) => update("basicDetails", "satsNumber", e.target.value)} required={false} disabled={!editable} />
            <InputGroup id="aadharNumber" name="aadharNumber" label="2. Aadhar No." value={form.basicDetails.aadharNumber ?? ""} onChange={(e) => update("basicDetails", "aadharNumber", e.target.value.replace(/\D/g, ''))} placeholder="12 Digit Number" required disabled={!editable} maxLength={12} onPaste={(e) => { e.preventDefault(); toast.error("Copy-paste is disabled."); }} />
            <InputGroup id="name" name="name" label="3. Name of the candidate (in BLOCK LETTERS only)" value={form.basicDetails.name ?? ""} onChange={(e) => update("basicDetails", "name", e.target.value.toUpperCase())} required disabled={!editable} className="md:col-span-3" />
            <InputGroup id="motherName" name="motherName" label="4. Name of the Mother" value={form.basicDetails.motherName ?? ""} onChange={(e) => update("basicDetails", "motherName", e.target.value.toUpperCase())} required disabled={!editable} className="md:col-span-3" />
            <InputGroup id="fatherName" name="fatherName" label="5. Name of the Father" value={form.basicDetails.fatherName ?? ""} onChange={(e) => update("basicDetails", "fatherName", e.target.value.toUpperCase())} required disabled={!editable} className="md:col-span-3" />
            
            <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 mb-1">
                6. Date of Birth <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                <select value={dobD ?? ""} onChange={(e) => updateDob(e.target.value, dobM, dobY)} disabled={!editable} className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 w-1/3">
                    <option value="">DD</option>
                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <select value={dobM ?? ""} onChange={(e) => updateDob(dobD, e.target.value, dobY)} disabled={!editable} className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 w-1/3">
                    <option value="">MM</option>
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="text" placeholder="YYYY" maxLength={4} value={dobY ?? ""} onChange={(e) => updateDob(dobD, dobM, e.target.value.replace(/\D/g, ''))} disabled={!editable} className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 w-1/3" />
                </div>
            </div>

            <SelectGroup id="gender" name="gender" label="7. Gender" value={form.basicDetails.gender ?? ""} onChange={(e) => update("basicDetails", "gender", e.target.value)} options={["Male", "Female", "Others"]} required disabled={!editable} />
            <SelectGroup id="nationality" name="nationality" label="8. Indian Nationality" value={form.basicDetails.nationality ?? ""} onChange={(e) => update("basicDetails", "nationality", e.target.value)} options={["Yes", "No"]} required disabled={!editable} />
            <SelectGroup id="religion" name="religion" label="9. Religion" value={form.basicDetails.religion ?? ""} onChange={(e) => update("basicDetails", "religion", e.target.value)} options={RELIGIONS} required disabled={!editable} className="md:col-span-3 lg:col-span-1" />
            </div>
        </div>

        {/* 2. QUALIFYING DETAILS */}
        <SectionHeader icon={BookOpen} title="Qualifying Details" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SelectGroup id="qualifyingExam" name="qualifyingExam" label="10. Qualifying Examination" value={form.qualifyingDetails.qualifyingExam ?? ""} onChange={(e) => update("qualifyingDetails", "qualifyingExam", e.target.value)} options={["SSLC", "CBSE", "ICSE", "OTHERS"]} required disabled={!editable} />
            <SelectGroup id="nativeState" name="nativeState" label="11. Code of the Native State" value={form.qualifyingDetails.nativeState ?? ""} onChange={(e) => { update("qualifyingDetails", "nativeState", e.target.value); update("qualifyingDetails", "nativeDistrict", ""); }} options={STATES} required disabled={!editable} />
            {form.qualifyingDetails.nativeState === "Karnataka" ? (
                <SelectGroup id="nativeDistrict" name="nativeDistrict" label="12. Native District" value={form.qualifyingDetails.nativeDistrict ?? ""} onChange={(e) => update("qualifyingDetails", "nativeDistrict", e.target.value)} options={KARNATAKA_DISTRICTS} required disabled={!editable} />
            ) : (
                <InputGroup id="nativeDistrict" name="nativeDistrict" label="12. Code of Native District" value={form.qualifyingDetails.nativeDistrict ?? ""} onChange={(e) => update("qualifyingDetails", "nativeDistrict", e.target.value)} required disabled={!editable} />
            )}
            </div>
        </div>

        {/* 3. STUDY & ELIGIBILITY */}
        <SectionHeader icon={Layers} title="Study & Eligibility" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <SelectGroup id="stateAppearedForQualifyingExam" name="stateAppearedForQualifyingExam" label="13. Code of State appeared for SSLC/Equiv" value={form.studyEligibility.stateAppearedForQualifyingExam ?? ""} onChange={(e) => update("studyEligibility", "stateAppearedForQualifyingExam", e.target.value)} options={STATES} required disabled={!editable} />
            <InputGroup id="yearsStudiedInKarnataka" name="yearsStudiedInKarnataka" label="14. Total No. of Years Studied in Karnataka" type="number" value={form.studyEligibility.yearsStudiedInKarnataka ?? ""} onChange={(e) => update("studyEligibility", "yearsStudiedInKarnataka", e.target.value)} required disabled={!editable} />
            <SelectGroup id="isRural" name="isRural" label="15. Studied in rural areas (1st to 10th)" value={form.studyEligibility.isRural ?? ""} onChange={(e) => update("studyEligibility", "isRural", e.target.value)} options={["Yes", "No"]} required disabled={!editable} />
            <SelectGroup id="isKannadaMedium" name="isKannadaMedium" label="16. Studied in Kannada Medium (1st to 10th)" value={form.studyEligibility.isKannadaMedium ?? ""} onChange={(e) => update("studyEligibility", "isKannadaMedium", e.target.value)} options={["Yes", "No"]} required disabled={!editable} />
            </div>
        </div>

        {/* 4. EXEMPTION & CLAIMS */}
        <SectionHeader icon={Layers} title="Exemption & Claims" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <SelectGroup id="isFiveYearExemption" name="isFiveYearExemption" label="17. Claiming exemption from 5 years rule" value={form.exemptionClaims.isFiveYearExemption ?? ""} onChange={(e) => update("exemptionClaims", "isFiveYearExemption", e.target.value)} options={["Yes", "No"]} required disabled={!editable} />
            {form.exemptionClaims.isFiveYearExemption === "Yes" && (
                <SelectGroup id="exemptionClause" name="exemptionClause" label="18. If Yes, Mention Clause code" value={form.exemptionClaims.exemptionClause ?? ""} onChange={(e) => update("exemptionClaims", "exemptionClause", e.target.value)} options={EXEMPTION_CLAUSES} required disabled={!editable} />
            )}
            <SelectGroup id="isHyderabadKarnataka" name="isHyderabadKarnataka" label="19. Claiming Hyd-Kar quota benefit" value={form.exemptionClaims.isHyderabadKarnataka ?? ""} onChange={(e) => update("exemptionClaims", "isHyderabadKarnataka", e.target.value)} options={["Yes", "No"]} required disabled={!editable} />
            <SelectGroup id="isSNQ" name="isSNQ" label="20. Claiming SNQ quota benefit" value={form.exemptionClaims.isSNQ ?? ""} onChange={(e) => update("exemptionClaims", "isSNQ", e.target.value)} options={["Yes", "No"]} required disabled={!editable} />
            </div>
        </div>

        {/* 5. SPECIAL CATEGORY */}
        <SectionHeader icon={Layers} title="Special Category" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <p className="text-xs font-bold mb-3 text-slate-500">21. Do you claiming Special Category benefit (Please Tick the appropriate box)</p>
            <div className="flex flex-wrap gap-6">
            {SPECIAL_CATEGORIES_LIST.map((key) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={!!form.specialCategory[key]} onChange={() => toggleCheck("specialCategory", key)} disabled={!editable} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                <span className="text-sm font-semibold text-slate-700">{key}</span>
                </label>
            ))}
            </div>
        </div>

        {/* 6. SHIFT DETAILS */}
        <SectionHeader icon={Layers} title="Shift Details" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <SelectGroup id="shiftType" name="shiftType" label="Shift (Tick appropriately)" value={form.shiftDetails.shiftType ?? ""} onChange={(e) => update("shiftDetails", "shiftType", e.target.value)} options={["Day Shift", "Evening Shift"]} required disabled={!editable} />
            
            {form.shiftDetails.shiftType === "Evening Shift" && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-200">
                <InputGroup id="experienceYears" name="experienceYears" label="Total service exp (Years)" type="number" value={form.shiftDetails.experienceYears ?? ""} onChange={(e) => update("shiftDetails", "experienceYears", e.target.value)} required disabled={!editable} />
                <InputGroup id="experienceMonths" name="experienceMonths" label="Total service exp (Months)" type="number" value={form.shiftDetails.experienceMonths ?? ""} onChange={(e) => update("shiftDetails", "experienceMonths", e.target.value)} required disabled={!editable} />
                <SelectGroup id="serviceCertificate" name="serviceCertificate" label="Service Cert & NOC attached" value={form.shiftDetails.serviceCertificate ?? ""} onChange={(e) => update("shiftDetails", "serviceCertificate", e.target.value)} options={["Yes", "No"]} required disabled={!editable} />
            </div>
            )}
        </div>

        {/* 7. CATEGORY DETAILS */}
        <SectionHeader icon={Layers} title="Category Details" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <SelectGroup id="hasCertificate" name="hasCertificate" label="22. Has the applicant submitted Income Certificate or Caste Certificate?" value={form.categoryDetails.hasCertificate ?? ""} onChange={(e) => update("categoryDetails", "hasCertificate", e.target.value)} options={["Yes", "No"]} disabled={!editable} className="md:col-span-3" />
            
            {form.categoryDetails.hasCertificate === "No" && (
                <SelectGroup id="hasAcknowledgement" name="hasAcknowledgement" label="23. Has the applicant submitted the Acknowledgement Number?" value={form.categoryDetails.hasAcknowledgement ?? ""} onChange={(e) => update("categoryDetails", "hasAcknowledgement", e.target.value)} options={["Yes", "No"]} disabled={!editable} className="md:col-span-3" />
            )}

            {form.categoryDetails.hasAcknowledgement === "Yes" && form.categoryDetails.hasCertificate === "No" && (
                <InputGroup id="acknowledgementNumber" name="acknowledgementNumber" label="24. Enter Acknowledgement Number" value={form.categoryDetails.acknowledgementNumber ?? ""} onChange={(e) => update("categoryDetails", "acknowledgementNumber", e.target.value)}  required={false} disabled={!editable} className="md:col-span-3" />
            )}

            <SelectGroup id="category" name="category" label="25. Reserved Category" value={form.categoryDetails.category ?? ""} onChange={(e) => update("categoryDetails", "category", e.target.value)} options={CATEGORIES} disabled={!editable} />
            <InputGroup id="casteName" name="casteName" label="26. Name of the Caste" value={form.categoryDetails.casteName ?? ""} onChange={(e) => update("categoryDetails", "casteName", e.target.value.toUpperCase())} required={form.categoryDetails.category !== "GM"} disabled={!editable} />
            <InputGroup id="annualIncome" name="annualIncome" label="27. Annual income from all sources" type="number" value={form.categoryDetails.annualIncome ?? ""} onChange={(e) => update("categoryDetails", "annualIncome", e.target.value)} required disabled={!editable} />
            </div>
        </div>

        {/* 8. CONTACT DETAILS & ADDRESS */}
        <SectionHeader icon={MapPin} title="Contact Details & Address" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <InputGroup id="mobile" name="mobile" label="28. Student Mobile Number" value={form.contactDetails.mobile ?? ""} onChange={(e) => update("contactDetails", "mobile", e.target.value.replace(/\D/g, ''))} required disabled={!editable} maxLength={10} />
            <InputGroup id="parentMobile" name="parentMobile" label="Parents Mobile Number" value={form.contactDetails.parentMobile ?? ""} onChange={(e) => update("contactDetails", "parentMobile", e.target.value.replace(/\D/g, ''))} required disabled={!editable} maxLength={10} />
            <InputGroup id="email" name="email" label="E-mail ID" type="email" value={form.contactDetails.email ?? ""} onChange={(e) => update("contactDetails", "email", e.target.value)} required disabled={!editable} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 border-t border-slate-200">
            <InputGroup id="address" name="address" label="Full Postal Address" value={form.contactDetails.address ?? ""} onChange={(e) => update("contactDetails", "address", e.target.value.toUpperCase())} disabled={!editable} required className="md:col-span-3" placeholder="BLOCK LETTERS ONLY"/>
            <SelectGroup id="state" name="state" label="State" value={form.contactDetails.state ?? ""} onChange={(e) => { update("contactDetails", "state", e.target.value); update("contactDetails", "district", ""); }} options={STATES} required disabled={!editable} />
            {form.contactDetails.state === "Karnataka" ? (
                <SelectGroup id="district" name="district" label="District" value={form.contactDetails.district ?? ""} onChange={(e) => update("contactDetails", "district", e.target.value)} options={KARNATAKA_DISTRICTS} required disabled={!editable} />
            ) : (
                <InputGroup id="district" name="district" label="District" value={form.contactDetails.district ?? ""} onChange={(e) => update("contactDetails", "district", e.target.value)} required disabled={!editable} />
            )}
            <InputGroup id="pincode" name="pincode" label="PIN CODE" value={form.contactDetails.pincode ?? ""} onChange={(e) => update("contactDetails", "pincode", e.target.value.replace(/\D/g, ''))} required disabled={!editable} maxLength={6} />
            </div>
        </div>

        {/* 9. EDUCATIONAL PARTICULARS (SSLC) */}
        <SectionHeader icon={BookOpen} title="Educational Particulars & Marks Details" />
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 border-b border-slate-200 pb-5">
            <InputGroup id="sslcRegisterNumber" name="sslcRegisterNumber" label="A) Register Number of SSLC / Equiv" value={form.educationalParticulars.sslcRegisterNumber ?? ""} onChange={(e) => update("educationalParticulars", "sslcRegisterNumber", e.target.value)} required disabled={!editable} />
            <InputGroup id="sslcPassingYear" name="sslcPassingYear" label="Year of Passing" value={form.educationalParticulars.sslcPassingYear ?? ""} onChange={(e) => update("educationalParticulars", "sslcPassingYear", e.target.value)} required disabled={!editable} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            <InputGroup id="sslcMaxMarks" name="sslcMaxMarks" label="1) Total Max Marks in all subjects" type="number" value={form.educationalParticulars.sslcMaxMarks ?? ""} onChange={(e) => update("educationalParticulars", "sslcMaxMarks", e.target.value)} required disabled={!editable} />
            <InputGroup id="sslcObtainedMarks" name="sslcObtainedMarks" label="Total Marks obtained" type="number" value={form.educationalParticulars.sslcObtainedMarks ?? ""} onChange={(e) => update("educationalParticulars", "sslcObtainedMarks", e.target.value)} required disabled={!editable} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            <InputGroup id="maxScienceMarks" name="maxScienceMarks" label="2) Max. Marks in Science" type="number" value={form.educationalParticulars.maxScienceMarks ?? ""} onChange={(e) => update("educationalParticulars", "maxScienceMarks", e.target.value)} required disabled={!editable} />
            <InputGroup id="obtainedScienceMarks" name="obtainedScienceMarks" label="Marks obtained (Science)" type="number" value={form.educationalParticulars.obtainedScienceMarks ?? ""} onChange={(e) => update("educationalParticulars", "obtainedScienceMarks", e.target.value)} required disabled={!editable} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
            <InputGroup id="maxMathsMarks" name="maxMathsMarks" label="3) Max. Marks in Maths" type="number" value={form.educationalParticulars.maxMathsMarks ?? ""} onChange={(e) => update("educationalParticulars", "maxMathsMarks", e.target.value)} required disabled={!editable} />
            <InputGroup id="obtainedMathsMarks" name="obtainedMathsMarks" label="Marks obtained (Maths)" type="number" value={form.educationalParticulars.obtainedMathsMarks ?? ""} onChange={(e) => update("educationalParticulars", "obtainedMathsMarks", e.target.value)} required disabled={!editable} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <InputGroup id="totalMaxScienceMaths" name="totalMaxScienceMaths" label="4) Total Max. Marks in Science & Maths" type="text" value={form.educationalParticulars.totalMaxScienceMaths ?? ""} onChange={() => {}} required={false} disabled={true} className="bg-slate-100" />
            <InputGroup id="totalObtainedScienceMaths" name="totalObtainedScienceMaths" label="Total Marks obtained in Science & Maths" type="text" value={form.educationalParticulars.totalObtainedScienceMaths ?? ""} onChange={() => {}} required={false} disabled={true} className="bg-slate-100" />
            </div>
        </div>

        {/* 10. DECLARATION */}
        <SectionHeader icon={CheckCircle} title="Declaration" />
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-3 mb-6 border-b border-yellow-200 pb-6">
            <input type="checkbox" id="declaration" name="declaration" checked={declarationChecked ?? false} onChange={(e) => setDeclarationChecked(e.target.checked)} disabled={!editable} className="mt-1.5 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
            <label htmlFor="declaration" className="text-sm font-bold text-slate-800 cursor-pointer select-none leading-relaxed">
                We declare that the above information is true and correct to the best our knowledge and belief. In case if any of the above information is found to be false or incorrect, we shall forfeit the claim to be considered for a seat in a polytechnic. In such an event, we will also be liable for civil and criminal action as the Government or the Department of Technical Education may take action against us in this behalf. Also we abide by the rules existing at the time of seat selection process.
            </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InputGroup id="candidateSignatureText" name="candidateSignatureText" label="Signature of the Candidate (Type Name)" value={form.declaration.candidateSignatureText ?? ""} onChange={(e) => update("declaration", "candidateSignatureText", e.target.value)} required disabled={!editable} placeholder="Type Full Name" />
            <InputGroup id="parentSignatureText" name="parentSignatureText" label="Signature of the Parent/Guardian (Type Name)" value={form.declaration.parentSignatureText ?? ""} onChange={(e) => update("declaration", "parentSignatureText", e.target.value)} required disabled={!editable} placeholder="Type Full Name" />
            </div>
        </div>

        {/* SUBMIT BUTTON */}
        {editable ? (
            <div className="mt-8 flex justify-center">
            <button type="button" onClick={submit} disabled={submitting} className={`w-full md:w-2/3 lg:w-1/2 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] ${submitting ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-xl"}`}>
                {submitting ? <>Processing...</> : <><CheckCircle className="w-5 h-5" /> {status === "CORRECTION_REQUIRED" ? "Resubmit Application" : "Submit Application"}</>}
            </button>
            </div>
        ) : (
            <div className="mt-8 px-8 py-4 bg-green-50 text-green-700 rounded-lg font-bold border border-green-200 flex justify-center items-center gap-3 text-lg">
            <CheckCircle className="w-6 h-6" /> ✅ Application Successfully Submitted
            </div>
        )}

        </div>
    </div>
    </div>
);
}