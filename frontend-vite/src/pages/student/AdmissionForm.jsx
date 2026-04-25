import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  User, MapPin, BookOpen, Layers, CheckCircle, AlertCircle, Camera, Upload, Image as ImageIcon, FileText, XCircle
} from "lucide-react"; 
import FullPageLoader from "../../components/FullPageLoader";

// --- CONFIGURATION ---
const BRANCHES = [
  { code: "CE", label: "Civil Engineering" },
  { code: "ME", label: "Mechanical Engineering" },
  { code: "EEE", label: "Electrical & Electronics Engineering (EEE)" },
  { code: "ECE", label: "Electronics & Communication Engineering (ECE)" },
  { code: "CSE", label: "Computer Science & Engineering (CSE)" },
  { code: "AE", label: "Automobile Engineering (AE)" },
  { code: "ChE", label: "Chemical Engineering (ChE)" },
  { code: "Poly", label: "Polymer Technology (Poly)" }
];

const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "Other"];
const MOTHER_TONGUES = ["Kannada", "Tulu", "Arebase", "English", "Hindi", "Malayalam", "Tamil", "Konnani", "Telugu"];
const NATIONALITIES = ["Indian", "Other"];

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
  admissionType: "", 
  personalDetails: {
    name: "", fatherName: "", motherName: "", dob: "", gender: "",
    religion: "", caste: "", nationality: "Indian", aadharNumber: "",
    satsNumber: "", address: "", district: "", state: "Karnataka",
    pincode: "", mobile: "", email: "", photo: "", 
    motherTongue: "", nativeState: "", nativeDistrict: "",
  },
  academicDetails: {
    board: "SSLC", sslcRegisterNumber: "", sslcPassingYear: "",
    sslcMaxMarks: "", sslcObtainedMarks: "", sslcPercentage: "",
    sslcMathsMarks: "", sslcScienceMarks: "",
    qualifyingExam: "", 
    itiTrade: "", yearsStudiedInKarnataka: "", stateAppearedForQualifyingExam: "",
    itiPucRegisterNumber: "", itiPucPassingYear: "",
    itiPucMaxMarks: "", itiPucObtainedMarks: "", itiPucPercentage: "",
  },
  categoryDetails: {
    category: "GM", casteName: "", annualIncome: "",
    isRural: false, isKannadaMedium: false, isStudyCertificateExempt: false,
  },
  branchPreferences: [],
  studyDetails: Array.from({ length: 10 }, (_, i) => ({
    level: `STD_${i + 1}`,
    academicYear: "",
    schoolName: "",
    district: "",
    state: "Karnataka",
    source: "MANUAL"
  })),
  documents: { 
    candidateSignature: "", parentSignature: "", sslcMarksCard: "",
    itiMarksCard: "", pucMarksCard: "", aadhaarCard: "",
    casteCertificate: "", incomeCertificate: "", ruralCertificate: "",
    kannadaCertificate: "", studyExemptionCertificate: ""
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
      className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
    />
  </div>
);

const SelectGroup = ({ id, name, label, value, onChange, options, disabled = false, required = true }) => (
  <div className="flex flex-col">
    <label htmlFor={id} className="text-xs font-bold mb-1 text-slate-500">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id} name={name} value={value ?? ""} onChange={onChange} disabled={disabled}
      className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50"
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

const FormFieldWrapper = ({ label, children }) => (
  <div className="flex flex-col">
    <label className="text-xs font-bold mb-1 text-slate-500">{label}</label>
    {children}
  </div>
);

const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 ${className}`}
  />
);

const Select = ({ options = [], className = "", ...props }) => (
  <select
    {...props}
    className={`w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 ${className}`}
  >
    <option value="">Select</option>
    {Array.isArray(options) &&
      options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
  </select>
);

const DocumentUpload = ({ id, name, label, value, onUpload, disabled, required = false, accept = "image/*" }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { getToken } = useAuth();
  
  const isPdf = (value && value.toLowerCase().endsWith(".pdf")) || accept === "application/pdf";

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setErrorMsg("");

    const isPdfUpload = accept === "application/pdf";
    const maxSize = isPdfUpload ? 5 * 1024 * 1024 : 2 * 1024 * 1024; 
    const typeErrorMsg = isPdfUpload ? `Invalid format. ${label} must be a PDF.` : `Invalid format. ${label} must be an Image (JPG/PNG).`;
    const sizeErrorMsg = `File size exceeded. Max allowed is ${isPdfUpload ? "5MB" : "2MB"}.`;

    if (isPdfUpload && file.type !== "application/pdf") {
      setErrorMsg(typeErrorMsg); toast.error(typeErrorMsg); return;
    }
    if (!isPdfUpload && !file.type.startsWith("image/")) {
      setErrorMsg(typeErrorMsg); toast.error(typeErrorMsg); return;
    }
    if (file.size > maxSize) {
      setErrorMsg(sizeErrorMsg); toast.error(sizeErrorMsg); return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("image", file); 
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload/image`, formData, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      onUpload(res.data.url);
      toast.success(`${label} uploaded!`);
    } catch (err) {
      const failMsg = `${label} upload failed.`;
      setErrorMsg(failMsg); toast.error(failMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <label htmlFor={id} className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex justify-between">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className={`relative group h-32 bg-slate-50 rounded border-2 border-dashed ${value ? 'border-green-300 bg-green-50' : 'border-slate-200'} flex flex-col items-center justify-center overflow-hidden transition-colors`}>
        {value ? (
          <>
            {isPdf ? (
              <div className="flex flex-col items-center text-red-600 cursor-pointer z-10" onClick={() => window.open(value, "_blank")}>
                <FileText className="w-10 h-10 mb-2" />
                <span className="text-[10px] font-bold uppercase text-slate-700">PDF Uploaded</span>
                <span className="text-[10px] text-blue-600 underline mt-1 px-2 py-1 bg-white rounded shadow-sm hover:text-blue-800">View Document</span>
              </div>
            ) : (
              <a href={value} target="_blank" rel="noreferrer" className="w-full h-full z-10 block">
                <img src={value} alt={label} className="w-full h-full object-contain" />
              </a>
            )}
            {!disabled && (
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-20 pointer-events-none">
                 <Upload className="text-white w-6 h-6" />
               </div>
            )}
          </>
        ) : (
          <div className="text-center pointer-events-none">
            {accept === "application/pdf" ? <FileText className="w-8 h-8 text-slate-300 mx-auto" /> : <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />}
            <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 block">
              {accept === "application/pdf" ? "Upload PDF" : "Upload Image"}
            </span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-30">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {!disabled && !loading && (
          <input id={id} name={name} type="file" onChange={handleFile} className="absolute inset-0 opacity-0 cursor-pointer z-40" accept={accept} />
        )}
      </div>
      <div className="mt-1 flex flex-col">
        {errorMsg && <span className="text-[10px] text-red-500 font-bold leading-tight mb-0.5">{errorMsg}</span>}
        <span className="text-[10px] text-slate-500 font-semibold leading-tight">
          {accept === "application/pdf" ? "PDF only \u2013 Max 5MB" : "Images only \u2013 Max 2MB"}
        </span>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function AdmissionForm() {
  const { getToken } = useAuth();
  const { user } = useUser();
  
  const [admissionsClosed, setAdmissionsClosed] = useState(false);
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState("NEW");
  const [remarks, setRemarks] = useState("");
  const [editable, setEditable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  
  const [rangeCtrl, setRangeCtrl] = useState({
    from: 1, to: 10, schoolName: "", district: "", state: "Karnataka", academicYear: ""
  });
  
  const [uploadingImg, setUploadingImg] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageErrorMsg, setImageErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        const token = await getToken();
        const settingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/admission/settings`);
        const { normalActive, lateralActive } = settingsRes.data;

        let activeType = null;
        if (normalActive) activeType = "NORMAL";
        else if (lateralActive) activeType = "LATERAL";

        if (!activeType) {
          setAdmissionsClosed(true); setLoading(false); return;
        }

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.application) {
          const app = res.data.application;
          if (app.personalDetails?.dob) app.personalDetails.dob = app.personalDetails.dob.split("T")[0];
          const mergedForm = {
            ...EMPTY_FORM, ...app, admissionType: app.admissionType || activeType,
            personalDetails: { ...EMPTY_FORM.personalDetails, ...app.personalDetails },
            academicDetails: { ...EMPTY_FORM.academicDetails, ...app.academicDetails },
            categoryDetails: { ...EMPTY_FORM.categoryDetails, ...app.categoryDetails },
            documents: { ...EMPTY_FORM.documents, ...app.documents },
          };
          setForm(mergedForm);
          if (app.personalDetails?.photo) setPreviewUrl(app.personalDetails.photo);
          setStatus(app.status); setRemarks(app.remarks || "");
          setEditable(["NEW", "DRAFT", "CORRECTION_REQUIRED"].includes(app.status));
          if (app.status !== "NEW" && app.status !== "DRAFT") setDeclarationChecked(true);
        } else {
          const initialForm = JSON.parse(JSON.stringify(EMPTY_FORM));
          initialForm.admissionType = activeType;
          if(user) {
             initialForm.personalDetails.email = user.primaryEmailAddress?.emailAddress || "";
             initialForm.personalDetails.name = user.fullName || "";
          }
          setForm(initialForm); setEditable(true);
        }
      } catch (error) {
        toast.error("Failed to load admission data.");
      } finally {
        setLoading(false);
      }
    };
    if(user) fetchApplicationData();
  }, [getToken, user]);

  const update = (section, field, value) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const toggleCheck = (section, field) => {
    setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: !prev[section][field] } }));
  };

  const updateStudy = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.studyDetails];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, studyDetails: updated };
    });
  };

const applyRangeStudy = () => {
  const { from, to, schoolName, district, state } = rangeCtrl;

  if (from < 1 || to > 10 || from > to) {
    toast.error("Invalid range (1–10)");
    return;
  }

  if (!schoolName || !district || !state) {
    toast.error("Fill all fields in control panel");
    return;
  }

  setForm(prev => {
    const updated = [...prev.studyDetails];

    for (let i = from - 1; i < to; i++) {
      updated[i] = {
        ...updated[i],
        schoolName,
        district,
        state
      };
    }

    return { ...prev, studyDetails: updated };
  });

  toast.success(`Applied STD_${from} → STD_${to}`);
};

const autoFillYears = (startYearStr) => {
  if (!startYearStr.includes("-")) {
    toast.error("Enter like 2014-15");
    return;
  }

  const [start] = startYearStr.split("-").map(Number);

  if (!start || start < 1900) {
    toast.error("Invalid year");
    return;
  }

  setForm(prev => {
    const updated = [...prev.studyDetails];

    for (let i = 0; i < 10; i++) {
      const y1 = start + i;
      const y2 = (y1 + 1).toString().slice(2); // only last 2 digits

      updated[i].academicYear = `${y1}-${y2}`;
    }

    return { ...prev, studyDetails: updated };
  });

  toast.success("Years auto-filled correctly!");
};
  const toggleBranch = (branchCode) => {
    if (!editable) return;
    setForm((prev) => {
      const isSelected = prev.branchPreferences.includes(branchCode);
      if (!isSelected && prev.branchPreferences.length >= 5) {
        toast.error("Maximum 5 branches allowed"); return prev;
      }
      return {
        ...prev,
        branchPreferences: isSelected ? prev.branchPreferences.filter((b) => b !== branchCode) : [...prev.branchPreferences, branchCode],
      };
    });
  };

  const handleMarksChange = (value, field, obtField, maxField, type) => {
    if (value !== "" && isNaN(Number(value))) return;
    const updatedSection = { ...form.academicDetails, [field]: value };
    const obtStr = field === obtField ? value : updatedSection[obtField];
    const maxStr = field === maxField ? value : updatedSection[maxField];
    const targetPerc = type === "sslc" ? "sslcPercentage" : "itiPucPercentage";

    if (obtStr === "" || maxStr === "") {
      updatedSection[targetPerc] = "";
      setForm(prev => ({ ...prev, academicDetails: updatedSection }));
      return;
    }
    const obt = Number(obtStr); const max = Number(maxStr);
    if (obt > max) {
      toast.error("Obtained marks cannot be greater than Total Marks");
      updatedSection[obtField] = ""; updatedSection[targetPerc] = "";
    } else if (max > 0) {
      updatedSection[targetPerc] = ((obt / max) * 100).toFixed(2);
    } else {
      updatedSection[targetPerc] = "0.00";
    }
    setForm(prev => ({ ...prev, academicDetails: updatedSection }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageErrorMsg("");
    if (!file.type.startsWith("image/")) { setImageErrorMsg("Must be an Image (JPG/PNG)."); toast.error("Must be an Image (JPG/PNG)."); return; }
    if (file.size > 2 * 1024 * 1024) { setImageErrorMsg("Max size is 2MB."); toast.error("Max size is 2MB."); return; }
    setPreviewUrl(URL.createObjectURL(file)); setImageError(false); setUploadingImg(true);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("image", file);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/upload/image`, formData, { headers: { Authorization: `Bearer ${token}` } });
      update("personalDetails", "photo", res.data.url);
      toast.success("Photo uploaded successfully!");
    } catch (err) {
      toast.error("Image upload failed."); setPreviewUrl(form.personalDetails.photo || "");
    } finally {
      setUploadingImg(false);
    }
  };

  const validateForm = () => {
    const { admissionType, personalDetails, academicDetails, categoryDetails, branchPreferences, documents, studyDetails } = form;
    const isNormal = admissionType === "NORMAL";
    const isLateral = admissionType === "LATERAL";

    const requiredPersonal = ["name", "dob", "gender", "religion", "aadharNumber", "address", "district", "state", "pincode", "mobile", "email", "photo"];
    for (let field of requiredPersonal) {
      if (isEmpty(personalDetails[field])) { toast.error(`Please fill Personal Details: ${field.replace(/([A-Z])/g, ' $1').trim()}`); return false; }
    }

    if (personalDetails.aadharNumber?.length !== 12) { toast.error("Aadhaar Number must be exactly 12 digits"); return false; }
    if (personalDetails.mobile?.length !== 10) { toast.error("Mobile Number must be exactly 10 digits"); return false; }
    if (personalDetails.pincode?.length !== 6) { toast.error("Pincode must be exactly 6 digits"); return false; }

    if (isLateral) {
      const reqLat = ['qualifyingExam', 'itiPucRegisterNumber', 'itiPucPassingYear', 'itiPucMaxMarks', 'itiPucObtainedMarks', 'yearsStudiedInKarnataka', 'stateAppearedForQualifyingExam'];
      for (let field of reqLat) if (isEmpty(academicDetails[field])) { toast.error(`Fill Qualifying Exam: ${field.replace('itiPuc', '').replace(/([A-Z])/g, ' $1').trim()}`); return false; }
      if (academicDetails.qualifyingExam?.includes("ITI") && isEmpty(academicDetails.itiTrade)) { toast.error("Please enter ITI Trade"); return false; }
      if (isEmpty(academicDetails.sslcRegisterNumber) || isEmpty(academicDetails.sslcObtainedMarks)) { toast.error("Please fill basic SSLC Details"); return false; }
    }

    if (isNormal) {
      const reqSSLC = ['board', 'sslcRegisterNumber', 'sslcPassingYear', 'sslcMaxMarks', 'sslcObtainedMarks', 'sslcScienceMarks', 'sslcMathsMarks'];
      for (let field of reqSSLC) if (isEmpty(academicDetails[field])) { toast.error(`Fill SSLC Details: ${field.replace(/([A-Z])/g, ' $1').trim()}`); return false; }
    }
    
    // Validate Study Details
    for (let row of studyDetails) {
      if (isEmpty(row.academicYear) || isEmpty(row.schoolName) || isEmpty(row.district) || isEmpty(row.state)) {
        toast.error(`Missing Study Details for ${row.level}`); return false;
      }
    }

    if (categoryDetails.category !== "GM" && isEmpty(categoryDetails.casteName)) { toast.error("Please fill Caste Name"); return false; }
    if (branchPreferences.length === 0) { toast.error("Please select at least one Branch Preference"); return false; }
    if (isEmpty(documents.candidateSignature) || isEmpty(documents.sslcMarksCard)) { toast.error("Missing required documents"); return false; }
    if (!declarationChecked) { toast.error("You must accept the declaration."); return false; }

    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/applications`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Application Submitted Successfully!");
      setStatus("SUBMITTED"); setEditable(false);
    } catch (e) {
      toast.error("Failed to submit application.");
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
           <p className="text-slate-500">Admissions are currently closed for the 2025-26 academic year.</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-slate-200">
        
        {/* HEADER */}
        <div className="bg-blue-900 p-6 text-white border-b-4 border-yellow-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl shadow-lg">K</div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">KPT Mangalore</h1>
              <p className="text-blue-200 text-sm md:text-base">Govt. Polytechnic (Autonomous) | 2025-26 Admissions</p>
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
          <div className="mb-10 p-5 rounded-lg border-2 border-blue-600 bg-blue-50 shadow-md flex justify-between items-start">
            <div>
              <p className="font-bold text-lg text-blue-800">
                {form.admissionType === "LATERAL" ? "Lateral Entry Admission" : "First Year Admission (Normal)"}
              </p>
              <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-semibold">
                {form.admissionType === "LATERAL" ? "Direct 2nd Year (2 Years)" : "Regular (3 Years)"}
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>

          <SectionHeader icon={User} title="Personal Details" />
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="w-full lg:w-56 flex-shrink-0 flex flex-col items-center">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Candidate Photo <span className="text-red-500">*</span></p>
                <div className="w-40 h-48 bg-slate-100 rounded border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative shadow-sm group hover:border-blue-400">
                  {previewUrl && !imageError ? (
                    <img src={previewUrl} alt="Candidate" className="w-full h-full object-cover" onError={() => setImageError(true)}/>
                  ) : (
                    <div className="text-center p-4"><User className="w-12 h-12 text-slate-300 mx-auto mb-2" /><span className="text-[10px] text-slate-400 uppercase font-bold">No Image</span></div>
                  )}
                  {uploadingImg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                </div>
                {editable && (
                  <>
                    <label htmlFor="candidatePhotoUpload" className="mt-3 w-40 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded shadow-sm cursor-pointer active:scale-95">
                      <Camera className="w-4 h-4" /> {previewUrl ? "Change Photo" : "Upload Photo"}
                      <input id="candidatePhotoUpload" name="candidatePhotoUpload" ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                    <div className="mt-2 flex flex-col items-center text-center">
                      {imageErrorMsg && <span className="text-[10px] text-red-500 font-bold leading-tight mb-0.5">{imageErrorMsg}</span>}
                      <span className="text-[10px] text-slate-500 font-semibold leading-tight">Images only – Max 2MB</span>
                    </div>
                  </>
                )}
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputGroup id="candidateName" name="candidateName" label="Candidate Name" value={form.personalDetails.name} onChange={(e) => update("personalDetails", "name", e.target.value)} required disabled={!editable} className="md:col-span-2" />
              <InputGroup id="satsNumber" name="satsNumber" label="SATS Number" value={form.personalDetails.satsNumber} onChange={(e) => update("personalDetails", "satsNumber", e.target.value)} required={false} disabled={!editable} />
              <InputGroup id="aadharNumber" name="aadharNumber" label="Aadhaar Number" value={form.personalDetails.aadharNumber} onChange={(e) => update("personalDetails", "aadharNumber", e.target.value.replace(/\D/g, ''))} placeholder="12 Digit Number" required disabled={!editable} maxLength={12} onPaste={(e) => { e.preventDefault(); toast.error("Copy-paste is disabled."); }} />
              <InputGroup id="fatherName" name="fatherName" label="Father's Name" value={form.personalDetails.fatherName} onChange={(e) => update("personalDetails", "fatherName", e.target.value)} required={false} disabled={!editable} />
              <InputGroup id="motherName" name="motherName" label="Mother's Name" value={form.personalDetails.motherName} onChange={(e) => update("personalDetails", "motherName", e.target.value)} required={false} disabled={!editable} />
              <InputGroup id="dob" name="dob" label="Date of Birth" type="date" value={form.personalDetails.dob} onChange={(e) => update("personalDetails", "dob", e.target.value)} required disabled={!editable} />
              <SelectGroup id="gender" name="gender" label="Gender" value={form.personalDetails.gender} onChange={(e) => update("personalDetails", "gender", e.target.value)} options={["Male", "Female", "Transgender"]} required disabled={!editable} />
              <SelectGroup id="religion" name="religion" label="Religion" value={form.personalDetails.religion} onChange={(e) => update("personalDetails", "religion", e.target.value)} options={RELIGIONS} required disabled={!editable} />
              <SelectGroup id="nationality" name="nationality" label="Nationality" value={form.personalDetails.nationality} onChange={(e) => update("personalDetails", "nationality", e.target.value)} options={NATIONALITIES} required={false} disabled={!editable} />
              <SelectGroup id="motherTongue" name="motherTongue" label="Mother Tongue" value={form.personalDetails.motherTongue} onChange={(e) => update("personalDetails", "motherTongue", e.target.value)} options={MOTHER_TONGUES} required={false} disabled={!editable} />
              <SelectGroup id="nativeState" name="nativeState" label="Native State" value={form.personalDetails.nativeState} onChange={(e) => { update("personalDetails", "nativeState", e.target.value); update("personalDetails", "nativeDistrict", ""); }} options={STATES} required={false} disabled={!editable} />
              {form.personalDetails.nativeState === "Karnataka" ? (
                <SelectGroup id="nativeDistrict" name="nativeDistrict" label="Native District" value={form.personalDetails.nativeDistrict} onChange={(e) => update("personalDetails", "nativeDistrict", e.target.value)} options={KARNATAKA_DISTRICTS} required={false} disabled={!editable} />
              ) : (
                <InputGroup id="nativeDistrict" name="nativeDistrict" label="Native District" value={form.personalDetails.nativeDistrict} onChange={(e) => update("personalDetails", "nativeDistrict", e.target.value)} required={false} disabled={!editable} />
              )}
            </div>
          </div>

          <SectionHeader icon={MapPin} title="Address & Contact" />
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
               <InputGroup id="address" name="address" label="Address Line" value={form.personalDetails.address} onChange={(e) => update("personalDetails", "address", e.target.value)} disabled={!editable} required className="md:col-span-3" placeholder="House No, Street, Landmark"/>
              <SelectGroup id="state" name="state" label="State" value={form.personalDetails.state} onChange={(e) => { update("personalDetails", "state", e.target.value); update("personalDetails", "district", ""); }} options={STATES} required disabled={!editable} />
              {form.personalDetails.state === "Karnataka" ? (
                <SelectGroup id="district" name="district" label="District" value={form.personalDetails.district} onChange={(e) => update("personalDetails", "district", e.target.value)} options={KARNATAKA_DISTRICTS} required disabled={!editable} />
              ) : (
                <InputGroup id="district" name="district" label="District" value={form.personalDetails.district} onChange={(e) => update("personalDetails", "district", e.target.value)} required disabled={!editable} />
              )}
              <InputGroup id="pincode" name="pincode" label="Pincode" value={form.personalDetails.pincode} onChange={(e) => update("personalDetails", "pincode", e.target.value.replace(/\D/g, ''))} required disabled={!editable} maxLength={6} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 pt-5 border-t border-slate-200">
               <InputGroup id="mobile" name="mobile" label="Mobile Number" value={form.personalDetails.mobile} onChange={(e) => update("personalDetails", "mobile", e.target.value.replace(/\D/g, ''))} required disabled={!editable} maxLength={10} />
               <InputGroup id="email" name="email" label="Email ID" type="email" value={form.personalDetails.email} onChange={(e) => update("personalDetails", "email", e.target.value)} required disabled={!editable} />
            </div>
          </div>

          <SectionHeader icon={BookOpen} title="Academic Information" />
          {form.admissionType === "LATERAL" && (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 shadow-sm">
              <h4 className="font-bold text-blue-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2"><Layers className="w-4 h-4"/> Qualifying Exam (ITI / PUC)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
                  <SelectGroup id="qualifyingExam" name="qualifyingExam" label="Exam Stream" value={form.academicDetails.qualifyingExam} onChange={(e) => update("academicDetails", "qualifyingExam", e.target.value)} options={["ITI (2 Years)", "PUC (Science)"]} required disabled={!editable} />
                  <InputGroup id="itiPucRegisterNumber" name="itiPucRegisterNumber" label="Reg Number" value={form.academicDetails.itiPucRegisterNumber} onChange={(e) => update("academicDetails", "itiPucRegisterNumber", e.target.value)} required disabled={!editable} />
                  <InputGroup id="itiPucPassingYear" name="itiPucPassingYear" label="Year of Passing" value={form.academicDetails.itiPucPassingYear} onChange={(e) => update("academicDetails", "itiPucPassingYear", e.target.value)} required disabled={!editable} />
                  <InputGroup id="stateAppearedForQualifyingExam" name="stateAppearedForQualifyingExam" label="State Appeared From" value={form.academicDetails.stateAppearedForQualifyingExam} onChange={(e) => update("academicDetails", "stateAppearedForQualifyingExam", e.target.value)} required disabled={!editable} />
                  <InputGroup id="yearsStudiedInKarnataka" name="yearsStudiedInKarnataka" label="Years Studied in Karnataka" type="number" value={form.academicDetails.yearsStudiedInKarnataka} onChange={(e) => update("academicDetails", "yearsStudiedInKarnataka", e.target.value)} required disabled={!editable} />
                  {form.academicDetails.qualifyingExam?.includes("ITI") && (
                    <InputGroup id="itiTrade" name="itiTrade" label="ITI Trade" value={form.academicDetails.itiTrade} onChange={(e) => update("academicDetails", "itiTrade", e.target.value)} required disabled={!editable} />
                  )}
              </div>
              <div className="grid grid-cols-3 gap-5">
                <InputGroup id="itiPucMaxMarks" name="itiPucMaxMarks" label="Max Marks" type="number" value={form.academicDetails.itiPucMaxMarks} onChange={(e) => handleMarksChange(e.target.value, "itiPucMaxMarks", "itiPucObtainedMarks", "itiPucMaxMarks", "iti")} required disabled={!editable} />
                <InputGroup id="itiPucObtainedMarks" name="itiPucObtainedMarks" label="Obtained" type="number" value={form.academicDetails.itiPucObtainedMarks} onChange={(e) => handleMarksChange(e.target.value, "itiPucObtainedMarks", "itiPucObtainedMarks", "itiPucMaxMarks", "iti")} required disabled={!editable} />
                <InputGroup id="itiPucPercentage" name="itiPucPercentage" label="Percentage" value={form.academicDetails.itiPucPercentage} disabled required={false} className="bg-white" />
              </div>
            </div>
          )}

          <div className="border border-slate-200 rounded-lg p-6 mb-6">
            <h4 className="font-bold text-slate-700 mb-4 text-sm uppercase tracking-wider">SSLC / 10th Standard</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-5">
               <SelectGroup id="board" name="board" label="Board" value={form.academicDetails.board} onChange={(e) => update("academicDetails", "board", e.target.value)} options={["SSLC (Karnataka)", "CBSE", "ICSE", "Other"]} required disabled={!editable} />
               <InputGroup id="sslcRegisterNumber" name="sslcRegisterNumber" label="Register No." value={form.academicDetails.sslcRegisterNumber} onChange={(e) => update("academicDetails", "sslcRegisterNumber", e.target.value)} required disabled={!editable} />
               <InputGroup id="sslcPassingYear" name="sslcPassingYear" label="Passing Year" value={form.academicDetails.sslcPassingYear} onChange={(e) => update("academicDetails", "sslcPassingYear", e.target.value)} required disabled={!editable} />
               {form.admissionType === "NORMAL" && (
                 <>
                   <InputGroup id="sslcScienceMarks" name="sslcScienceMarks" label="Science Marks" type="number" value={form.academicDetails.sslcScienceMarks} onChange={(e) => update("academicDetails", "sslcScienceMarks", e.target.value)} required disabled={!editable} />
                   <InputGroup id="sslcMathsMarks" name="sslcMathsMarks" label="Maths Marks" type="number" value={form.academicDetails.sslcMathsMarks} onChange={(e) => update("academicDetails", "sslcMathsMarks", e.target.value)} required disabled={!editable} />
                 </>
               )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
              <InputGroup id="sslcMaxMarks" name="sslcMaxMarks" label="Total Max" type="number" value={form.academicDetails.sslcMaxMarks} onChange={(e) => handleMarksChange(e.target.value, "sslcMaxMarks", "sslcObtainedMarks", "sslcMaxMarks", "sslc")} required disabled={!editable} />
              <InputGroup id="sslcObtainedMarks" name="sslcObtainedMarks" label="Total Obtained" type="number" value={form.academicDetails.sslcObtainedMarks} onChange={(e) => handleMarksChange(e.target.value, "sslcObtainedMarks", "sslcObtainedMarks", "sslcMaxMarks", "sslc")} required disabled={!editable} />
              <InputGroup id="sslcPercentage" name="sslcPercentage" label="Percentage" value={form.academicDetails.sslcPercentage} disabled required={false} className="bg-slate-50" />
            </div>
          </div>

          <SectionHeader icon={MapPin} title="Study Details (Last 10 Years)" subtitle="Ensure continuous study details from 1st to 10th Standard" />
          <div className="bg-white border-2 border-blue-100 rounded-xl overflow-hidden shadow-sm mb-10">
            <div className="bg-blue-50 p-6 border-b-2 border-blue-100">
               <h5 className="text-[11px] font-black text-blue-800 uppercase mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> Quick Apply Control Panel</h5>
              <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
                <FormFieldWrapper label="From Class">
                  <Select value={rangeCtrl.from} options={[1,2,3,4,5,6,7,8,9,10]} onChange={e => setRangeCtrl({...rangeCtrl, from: Number(e.target.value)})} disabled={!editable} />
                </FormFieldWrapper>
                <FormFieldWrapper label="To Class">
                  <Select value={rangeCtrl.to} options={[1,2,3,4,5,6,7,8,9,10]} onChange={e => setRangeCtrl({...rangeCtrl, to: Number(e.target.value)})} disabled={!editable} />
                </FormFieldWrapper>
                
                <div className="col-span-2">
                  <FormFieldWrapper label="School Name">
                    <Input value={rangeCtrl.schoolName} onChange={e => setRangeCtrl({...rangeCtrl, schoolName: e.target.value})} disabled={!editable} />
                  </FormFieldWrapper>
                </div>
           <FormFieldWrapper label="District">
  {rangeCtrl.state === "Karnataka" ? (
    <Select
      value={rangeCtrl.district}
      options={KARNATAKA_DISTRICTS}
      onChange={e => setRangeCtrl({...rangeCtrl, district: e.target.value})}
      disabled={!editable}
    />
  ) : (
    <Input
      value={rangeCtrl.district}
      onChange={e => setRangeCtrl({...rangeCtrl, district: e.target.value})}
      disabled={!editable}
    />
  )}
</FormFieldWrapper>
                <FormFieldWrapper label="State">
                  <Select value={rangeCtrl.state} options={STATES} onChange={e => setRangeCtrl({...rangeCtrl, state: e.target.value})} disabled={!editable} />
                </FormFieldWrapper>
                <div className="flex flex-col gap-1">
                  <button type="button" onClick={applyRangeStudy} disabled={!editable} className="bg-blue-700 text-white font-bold h-[38px] rounded hover:bg-blue-800 active:scale-95 transition-all text-xs">APPLY</button>
                  <button type="button" onClick={() => autoFillYears(form.studyDetails[0].academicYear)} disabled={!editable} className="bg-slate-700 text-white font-bold h-[38px] rounded hover:bg-slate-800 active:scale-95 transition-all text-xs">AUTO YEAR</button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="p-3 text-[10px] font-black uppercase text-slate-500 w-24">Level</th>
                        <th className="p-3 text-[10px] font-black uppercase text-slate-500 w-40">Academic Year</th>
                        <th className="p-3 text-[10px] font-black uppercase text-slate-500">School Name</th>
                        <th className="p-3 text-[10px] font-black uppercase text-slate-500 w-48">District</th>
                        <th className="p-3 text-[10px] font-black uppercase text-slate-500 w-40">State</th>
                      </tr>
                  </thead>
                  <tbody>
                     {form.studyDetails.map((row, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                           <td className="p-3 font-bold text-slate-700 text-sm">{row.level}</td>
                           <td className="p-2">
                              <Input
  placeholder="20XX-20XX"
  value={row.academicYear}
  onChange={e => {
    updateStudy(idx, "academicYear", e.target.value);

    if (idx === 0 && e.target.value.includes("-")) {
  autoFillYears(e.target.value);
}
  }}
  disabled={!editable}
/>
                           </td>
                           <td className="p-2">
                              <Input value={row.schoolName} onChange={e => updateStudy(idx, "schoolName", e.target.value)} disabled={!editable} />
                           </td>
                           <td className="p-2">
                           {row.state === "Karnataka" ? (
  <Select
    value={row.district}
    options={KARNATAKA_DISTRICTS}
    onChange={e => updateStudy(idx, "district", e.target.value)}
    disabled={!editable}
  />
) : (
  <Input
    value={row.district}
    onChange={e => updateStudy(idx, "district", e.target.value)}
    disabled={!editable}
  />
)}
                           </td>
                           <td className="p-2">
                              <Select value={row.state} options={STATES} onChange={e => updateStudy(idx, "state", e.target.value)} disabled={!editable} />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>

          <SectionHeader icon={Layers} title="Category & Reservation" />
          <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <SelectGroup id="category" name="category" label="Category" value={form.categoryDetails.category} onChange={(e) => update("categoryDetails", "category", e.target.value)} options={[
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
]} disabled={!editable} />
              <InputGroup id="casteName" name="casteName" label="Caste Name" value={form.categoryDetails.casteName} onChange={(e) => update("categoryDetails", "casteName", e.target.value)} required={form.categoryDetails.category !== "GM"} disabled={!editable} />
              <InputGroup id="annualIncome" name="annualIncome" label="Annual Income (₹)" type="number" value={form.categoryDetails.annualIncome} onChange={(e) => update("categoryDetails", "annualIncome", e.target.value)} disabled={!editable} />
            </div>
            <div className="flex flex-wrap gap-4 mt-6">
                {[ { key: "isRural", label: "Rural Quota (1st-10th Rural)" }, { key: "isKannadaMedium", label: "Kannada Medium Quota" }, { key: "isStudyCertificateExempt", label: "Exemption from 7-Years Study Rule" } ].map((item) => (
                 <label key={item.key} htmlFor={item.key} className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${form.categoryDetails[item.key] ? "bg-blue-50 border-blue-500 ring-1 ring-blue-500" : "bg-white border-slate-200 hover:bg-slate-50"} ${!editable && "opacity-60 cursor-not-allowed"}`}>
                   <input id={item.key} name={item.key} type="checkbox" checked={!!form.categoryDetails[item.key]} onChange={() => toggleCheck("categoryDetails", item.key)} disabled={!editable} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                   <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                 </label>
                ))}
            </div>
          </div>

          <SectionHeader icon={Upload} title="Document Uploads" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            <DocumentUpload id="candidateSignature" name="candidateSignature" label="Candidate Signature" value={form.documents.candidateSignature} onUpload={(url) => update("documents", "candidateSignature", url)} required disabled={!editable} accept="image/*" />
            <DocumentUpload id="parentSignature" name="parentSignature" label="Parent Signature" value={form.documents.parentSignature} onUpload={(url) => update("documents", "parentSignature", url)} required disabled={!editable} accept="image/*" />
            <DocumentUpload id="sslcMarksCard" name="sslcMarksCard" label="SSLC Marks Card" value={form.documents.sslcMarksCard} onUpload={(url) => update("documents", "sslcMarksCard", url)} required disabled={!editable} accept="application/pdf" />
            <DocumentUpload id="aadhaarCard" name="aadhaarCard" label="Aadhaar Card" value={form.documents.aadhaarCard} onUpload={(url) => update("documents", "aadhaarCard", url)} required disabled={!editable} accept="application/pdf" />
            {form.admissionType === "LATERAL" && form.academicDetails.qualifyingExam?.includes("ITI") && (
               <DocumentUpload id="itiMarksCard" name="itiMarksCard" label="ITI Marks Card" value={form.documents.itiMarksCard} onUpload={(url) => update("documents", "itiMarksCard", url)} required disabled={!editable} accept="application/pdf" />
            )}
            {form.admissionType === "LATERAL" && form.academicDetails.qualifyingExam?.includes("PUC") && (
               <DocumentUpload id="pucMarksCard" name="pucMarksCard" label="PUC Marks Card" value={form.documents.pucMarksCard} onUpload={(url) => update("documents", "pucMarksCard", url)} required disabled={!editable} accept="application/pdf" />
            )}
            {form.categoryDetails.category !== "GM" && (
               <DocumentUpload id="casteCertificate" name="casteCertificate" label="Caste Certificate" value={form.documents.casteCertificate} onUpload={(url) => update("documents", "casteCertificate", url)} required disabled={!editable} accept="application/pdf" />
            )}
            {Number(form.categoryDetails.annualIncome) > 0 && (
               <DocumentUpload id="incomeCertificate" name="incomeCertificate" label="Income Certificate" value={form.documents.incomeCertificate} onUpload={(url) => update("documents", "incomeCertificate", url)} required disabled={!editable} accept="application/pdf" />
            )}
            {form.categoryDetails.isRural && (
               <DocumentUpload id="ruralCertificate" name="ruralCertificate" label="Rural Certificate" value={form.documents.ruralCertificate} onUpload={(url) => update("documents", "ruralCertificate", url)} required disabled={!editable} accept="application/pdf" />
            )}
            {form.categoryDetails.isKannadaMedium && (
               <DocumentUpload id="kannadaCertificate" name="kannadaCertificate" label="Kannada Medium Cert" value={form.documents.kannadaCertificate} onUpload={(url) => update("documents", "kannadaCertificate", url)} required disabled={!editable} accept="application/pdf" />
            )}
            {form.categoryDetails.isStudyCertificateExempt && (
               <DocumentUpload id="studyExemptionCertificate" name="studyExemptionCertificate" label="Study Exemption Cert" value={form.documents.studyExemptionCertificate} onUpload={(url) => update("documents", "studyExemptionCertificate", url)} required disabled={!editable} accept="application/pdf" />
            )}
          </div>

          <SectionHeader icon={Layers} title="Branch Preferences" />
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-inner">
             <div className="flex justify-between items-center mb-4">
               <p className="text-xs font-bold text-slate-500 uppercase">Select branches in order of priority <span className="text-red-500">*</span></p>
               <span className="text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">Selected: {form.branchPreferences.length}</span>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
               {BRANCHES.map((b) => {
                 const selected = form.branchPreferences.includes(b.code);
                 const index = form.branchPreferences.indexOf(b.code) + 1;
                 return (
                  <button key={b.code} type="button" disabled={!editable} onClick={() => toggleBranch(b.code)} className={`relative p-3 rounded-lg text-sm font-bold text-left transition-all border flex items-center justify-between group ${selected ? "bg-blue-600 text-white border-blue-700 shadow-md" : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-700"} ${!editable && "opacity-60 cursor-not-allowed"}`}>
                    <span>{b.label}</span>
                    {selected ? <span className="w-6 h-6 bg-white text-blue-600 text-xs font-extrabold flex items-center justify-center rounded-full shadow">{index}</span> : <span className="w-6 h-6 border-2 border-slate-200 rounded-full group-hover:border-blue-300"></span>}
                  </button>
                 );
               })}
             </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center">
            {editable ? (
              <>
                <div className="w-full max-w-2xl bg-yellow-50 border border-yellow-200 rounded-lg p-5 mb-6 shadow-sm">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="declaration" name="declaration" checked={declarationChecked} onChange={(e) => setDeclarationChecked(e.target.checked)} className="mt-1.5 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                    <label htmlFor="declaration" className="text-sm text-slate-700 cursor-pointer select-none leading-relaxed">
                      I, <span className="font-bold text-blue-900 border-b border-blue-900 px-1">{form.personalDetails.name || "__________________"}</span>, 
                      {form.personalDetails.fatherName && <span> S/D/o <span className="font-bold text-blue-900 border-b border-blue-900 px-1">{form.personalDetails.fatherName}</span>,</span>} 
                      hereby declare that the entries made by me in this application form are correct to the best of my knowledge and belief.
                    </label>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-2/3 lg:w-1/2 justify-center">
                   <button type="button" onClick={submit} disabled={submitting} className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-bold text-lg text-white shadow-lg transition-all transform active:scale-[0.98] w-full ${submitting ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-xl"}`}>
                     {submitting ? <>Processing...</> : <><CheckCircle className="w-5 h-5" /> {status === "CORRECTION_REQUIRED" ? "Resubmit Application" : "Submit Application"}</>}
                   </button>
                </div>
              </>
            ) : (
              <div className="px-8 py-4 bg-green-50 text-green-700 rounded-lg font-bold border border-green-200 flex items-center gap-3 text-lg"><CheckCircle className="w-6 h-6" /> ✅ Application Successfully Submitted</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}