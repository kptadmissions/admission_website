// src/pages/verification/EditApplication.jsx
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
    User, MapPin, BookOpen, Layers, CheckCircle, Search, 
    Loader2, Filter, RotateCcw, Edit3, ArrowLeft
} from "lucide-react"; 
import FullPageLoader from "../../components/FullPageLoader";
import debounce from "lodash.debounce";

// --- CONFIGURATION ---
const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Parsi", "Other"];
const CATEGORIES = [
  "GM", "SC - Category A", "SC - Category B", "SC - Category C", 
  "ST", "Cat-1", "2A", "2B", "3A", "3B"
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
    basicDetails: { satsNumber: "", aadharNumber: "", name: "", motherName: "", fatherName: "", dob: "", gender: "", nationality: "Yes", religion: "" },
    qualifyingDetails: { qualifyingExam: "", nativeState: "Karnataka", nativeDistrict: "" },
    studyEligibility: { stateAppearedForQualifyingExam: "Karnataka", yearsStudiedInKarnataka: "", isRural: "No", isKannadaMedium: "No" },
    exemptionClaims: { isFiveYearExemption: "No", exemptionClause: "", isHyderabadKarnataka: "No", isSNQ: "No" },
    specialCategory: { JTS: false, JOC: false, EDP: false, DP: false, PS: false, SP: false, SG: false, AI: false, CI: false, GK: false, ITI: false, NCC: false, PH: false },
    shiftDetails: { shiftType: "Day Shift", experienceYears: "", experienceMonths: "", serviceCertificate: "No" },
    categoryDetails: { hasCertificate: "", hasAcknowledgement: "", acknowledgementNumber: "", category: "GM", casteName: "", annualIncome: "" },
    contactDetails: { mobile: "", parentMobile: "", email: "", address: "", state: "Karnataka", district: "", pincode: "" },
    educationalParticulars: { sslcRegisterNumber: "", sslcPassingYear: "", sslcMaxMarks: "", sslcObtainedMarks: "", maxScienceMarks: "", obtainedScienceMarks: "", maxMathsMarks: "", obtainedMathsMarks: "", totalMaxScienceMaths: "", totalObtainedScienceMaths: "" },
    declaration: { candidateSignatureText: "", parentSignatureText: "" }
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
            className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-500 transition-all"
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

export default function EditApplication() {
    const { getToken } = useAuth();
    
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [results, setResults] = useState([]);
    const [filters, setFilters] = useState({ name: "", fatherName: "", mobile: "", sslc: "", fromDate: "", toDate: "" });
    const [form, setForm] = useState(null);
    const [declarationChecked, setDeclarationChecked] = useState(false);

    // Search Logic
    const fetchApplications = async (searchFilters) => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications/search-all`, {
                params: searchFilters,
                headers: { Authorization: `Bearer ${token}` }
            });
            setResults(res.data);
        } catch (error) {
            toast.error("Error fetching applications");
        } finally {
            setLoading(false);
        }
    };

    const debouncedFetch = useCallback(debounce((query) => fetchApplications(query), 400), []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        debouncedFetch(newFilters);
    };

    const resetFilters = () => {
        const cleared = { name: "", fatherName: "", mobile: "", sslc: "", fromDate: "", toDate: "" };
        setFilters(cleared);
        fetchApplications(cleared);
    };

    // Load Data into Form
    const handleEditClick = async (application) => {
        try {
            const token = await getToken();
            const sslc = application.educationalParticulars.sslcRegisterNumber;

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications/search?sslc=${sslc}`);
            const data = JSON.parse(JSON.stringify(res.data));

            // ✅ SAFE FALLBACK
            const safeData = {
                ...EMPTY_FORM,
                ...data,
                basicDetails: data.basicDetails || EMPTY_FORM.basicDetails,
                qualifyingDetails: data.qualifyingDetails || EMPTY_FORM.qualifyingDetails,
                studyEligibility: data.studyEligibility || EMPTY_FORM.studyEligibility,
                exemptionClaims: data.exemptionClaims || EMPTY_FORM.exemptionClaims,
                specialCategory: data.specialCategory || EMPTY_FORM.specialCategory,
                shiftDetails: data.shiftDetails || EMPTY_FORM.shiftDetails,
                categoryDetails: data.categoryDetails || EMPTY_FORM.categoryDetails,
                contactDetails: data.contactDetails || EMPTY_FORM.contactDetails,
                educationalParticulars: data.educationalParticulars || EMPTY_FORM.educationalParticulars,
                declaration: data.declaration || EMPTY_FORM.declaration
            };

            // ✅ DOB FIX: Convert backend Date to DD-MM-YYYY
            if (safeData.basicDetails?.dob && safeData.basicDetails.dob.includes("-") && safeData.basicDetails.dob.length > 10) {
                const d = new Date(safeData.basicDetails.dob);
                if (!isNaN(d.getTime())) {
                    safeData.basicDetails.dob = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                }
            }

            setForm(safeData);
            setDeclarationChecked(true); // Default to true in edit mode since they already accepted it
            setIsEditing(true);
            window.scrollTo(0, 0);

        } catch (err) {
            toast.error("Failed to load full application");
        }
    };

    // Auto Calculations
    useEffect(() => {
        if (!form || !isEditing) return;
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
        form?.educationalParticulars.obtainedMathsMarks,
        isEditing
    ]);

    // Auto Signature
    useEffect(() => {
        if (!form || !isEditing) return;
        setForm(prev => ({
            ...prev,
            declaration: {
                ...prev.declaration,
                candidateSignatureText: prev.basicDetails?.name || "",
                parentSignatureText: prev.basicDetails?.fatherName || ""
            }
        }));
    }, [form?.basicDetails?.name, form?.basicDetails?.fatherName, isEditing]);

    const update = (section, field, value) => {
        setForm(prev => ({
            ...prev,
            [section]: { ...prev[section], [field]: value }
        }));
    };

    const toggleCheck = (section, field) => {
        setForm((prev) => ({ ...prev, [section]: { ...prev[section], [field]: !prev[section][field] } }));
    };

    // Validation
    const validateForm = () => {
        const { basicDetails, contactDetails, educationalParticulars, declaration } = form;

        const requiredBasic = ["aadharNumber", "name", "dob", "gender", "religion"];
        for (let field of requiredBasic) {
            if (isEmpty(basicDetails[field])) { toast.error(`Please fill basic detail: ${field}`); return false; }
        }

        if (basicDetails.aadharNumber?.length !== 12) { toast.error("Aadhaar Number must be exactly 12 digits"); return false; }
        
        if (!/^\d{2}-\d{2}-\d{4}$/.test(basicDetails.dob)) {
            toast.error("Date of Birth must be complete (DD, MM, and 4-digit YYYY)"); return false;
        }

        if (isEmpty(contactDetails.mobile) || contactDetails.mobile.length !== 10) { toast.error("Student Mobile Number must be exactly 10 digits"); return false; }
        if (isEmpty(contactDetails.parentMobile) || contactDetails.parentMobile.length !== 10) { toast.error("Parent Mobile Number must be exactly 10 digits"); return false; }
        if (isEmpty(contactDetails.pincode) || contactDetails.pincode.length !== 6) { toast.error("Pincode must be exactly 6 digits"); return false; }

        const sslcFields = ['sslcRegisterNumber', 'sslcPassingYear', 'sslcMaxMarks', 'sslcObtainedMarks', 'maxScienceMarks', 'obtainedScienceMarks', 'maxMathsMarks', 'obtainedMathsMarks'];
        for (let field of sslcFields) {
            if (isEmpty(educationalParticulars[field])) { toast.error(`Please fill SSLC mark details`); return false; }
        }

        if (Number(educationalParticulars.sslcObtainedMarks) > Number(educationalParticulars.sslcMaxMarks)) {
            toast.error("Total Obtained marks cannot be greater than Total Max marks"); return false;
        }
        if (Number(educationalParticulars.obtainedScienceMarks) > Number(educationalParticulars.maxScienceMarks)) {
            toast.error("Science Obtained marks cannot be greater than Science Max marks"); return false;
        }
        if (Number(educationalParticulars.obtainedMathsMarks) > Number(educationalParticulars.maxMathsMarks)) {
            toast.error("Maths Obtained marks cannot be greater than Maths Max marks"); return false;
        }

        if (isEmpty(declaration.candidateSignatureText) || isEmpty(declaration.parentSignatureText)) {
            toast.error("Please provide both signatures in the declaration section"); return false;
        }

        if (!declarationChecked) { toast.error("You must accept the declaration."); return false; }

        return true;
    };

    const submitUpdate = async () => {
        if (!validateForm()) return;
        setSubmitting(true);

        try {
            const token = await getToken();
            const payload = JSON.parse(JSON.stringify(form)); // Deep copy to prevent mutation
            const sslcId = payload.educationalParticulars.sslcRegisterNumber;

            await axios.put(
                `${import.meta.env.VITE_API_URL}/applications/update/${sslcId}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success("Application Updated Successfully!");
            setIsEditing(false);
            fetchApplications(filters);
        } catch (e) {
            toast.error(e.response?.data?.message || "Failed to update application.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !isEditing) return <FullPageLoader label="Searching applications..." />;

    const dobParts = form?.basicDetails?.dob ? form.basicDetails.dob.split("-") : ["", "", ""];
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
                            <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">Application Edit Page</h1>
                        </div>
                    </div>
                    {isEditing && (
                        <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 bg-blue-800 hover:bg-blue-700 px-5 py-2 rounded-lg text-sm font-bold border border-blue-600 transition-all">
                            <ArrowLeft className="w-4 h-4" /> Exit Edit Mode
                        </button>
                    )}
                </div>

                {!isEditing ? (
                    /* SEARCH LIST VIEW */
                    <div className="p-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
                            <div className="flex items-center gap-2 mb-4 text-blue-900">
                                <Filter className="w-5 h-5" />
                                <h2 className="font-bold uppercase tracking-wider text-sm">Find Application to Edit</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <InputGroup id="searchName" label="Candidate Name" name="name" value={filters.name} onChange={handleFilterChange} required={false} placeholder="Enter name" />
                                <InputGroup id="searchSslc" label="SSLC Register No" name="sslc" value={filters.sslc} onChange={handleFilterChange} required={false} placeholder="Enter SSLC number" />
                                <InputGroup id="searchMobile" label="Mobile No" name="mobile" value={filters.mobile} onChange={handleFilterChange} required={false} placeholder="Enter mobile" />
                            </div>
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                                <button onClick={resetFilters} className="flex items-center gap-2 px-5 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg text-sm transition-all"><RotateCcw className="w-4 h-4" /> Reset</button>
                                <button onClick={() => fetchApplications(filters)} className="flex items-center gap-2 bg-blue-600 text-white font-bold px-8 py-2 rounded-lg text-sm shadow-md hover:bg-blue-700 transition-all"><Search className="w-4 h-4" /> Search</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-800 text-white">
                                    <tr>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider">Candidate Name</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider">SSLC No</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider">Contact</th>
                                        <th className="px-6 py-4 font-bold uppercase tracking-wider text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {results.length > 0 ? (
                                        results.map((app) => (
                                            <tr key={app._id} className="hover:bg-blue-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 uppercase">{app.basicDetails?.name || "N/A"}</div>
                                                    <div className="text-xs text-slate-500">Father: {app.basicDetails?.fatherName || "N/A"}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono font-bold text-blue-700">{app.educationalParticulars?.sslcRegisterNumber}</td>
                                                <td className="px-6 py-4">{app.contactDetails?.mobile || "N/A"}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleEditClick(app)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-blue-700 flex items-center gap-2 mx-auto transition-all"><Edit3 className="w-3 h-3" /> Edit Profile</button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="4" className="px-6 py-20 text-center text-slate-400 font-medium">Search for an application to get started...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* EDIT FORM VIEW */
                    <div className="p-6 md:p-10">
                        {/* 1. BASIC DETAILS */}
                        <SectionHeader icon={User} title="Basic Details" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <InputGroup id="satsNumber" name="satsNumber" label="1. SATS NO" value={form.basicDetails?.satsNumber ?? ""} onChange={(e) => update("basicDetails", "satsNumber", e.target.value)} required={false} />
                                <InputGroup id="aadharNumber" name="aadharNumber" label="2. Aadhar No." value={form.basicDetails?.aadharNumber ?? ""} onChange={(e) => update("basicDetails", "aadharNumber", e.target.value.replace(/\D/g, ''))} placeholder="12 Digit Number" required maxLength={12} />
                                <InputGroup id="name" name="name" label="3. Name of the candidate (in BLOCK LETTERS only)" value={form.basicDetails?.name ?? ""} onChange={(e) => update("basicDetails", "name", e.target.value.toUpperCase())} required className="md:col-span-3" />
                                <InputGroup id="motherName" name="motherName" label="4. Name of the Mother" value={form.basicDetails?.motherName ?? ""} onChange={(e) => update("basicDetails", "motherName", e.target.value.toUpperCase())} required className="md:col-span-3" />
                                <InputGroup id="fatherName" name="fatherName" label="5. Name of the Father" value={form.basicDetails?.fatherName ?? ""} onChange={(e) => update("basicDetails", "fatherName", e.target.value.toUpperCase())} required className="md:col-span-3" />
                                
                                <div className="flex flex-col">
                                    <label className="text-xs font-bold text-slate-500 mb-1">
                                    6. Date of Birth <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <select value={dobD ?? ""} onChange={(e) => updateDob(e.target.value, dobM, dobY)} className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none w-1/3">
                                            <option value="">DD</option>
                                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                        <select value={dobM ?? ""} onChange={(e) => updateDob(dobD, e.target.value, dobY)} className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none w-1/3">
                                            <option value="">MM</option>
                                            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <input type="text" placeholder="YYYY" maxLength={4} value={dobY ?? ""} onChange={(e) => updateDob(dobD, dobM, e.target.value.replace(/\D/g, ''))} className="border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none w-1/3" />
                                    </div>
                                </div>

                                <SelectGroup id="gender" name="gender" label="7. Gender" value={form.basicDetails?.gender ?? ""} onChange={(e) => update("basicDetails", "gender", e.target.value)} options={["Male", "Female", "Others"]} required />
                                <SelectGroup id="nationality" name="nationality" label="8. Indian Nationality" value={form.basicDetails?.nationality ?? ""} onChange={(e) => update("basicDetails", "nationality", e.target.value)} options={["Yes", "No"]} required />
                                <SelectGroup id="religion" name="religion" label="9. Religion" value={form.basicDetails?.religion ?? ""} onChange={(e) => update("basicDetails", "religion", e.target.value)} options={RELIGIONS} required className="md:col-span-3 lg:col-span-1" />
                            </div>
                        </div>

                        {/* 2. QUALIFYING DETAILS */}
                        <SectionHeader icon={BookOpen} title="Qualifying Details" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <SelectGroup id="qualifyingExam" name="qualifyingExam" label="10. Qualifying Examination" value={form.qualifyingDetails?.qualifyingExam ?? ""} onChange={(e) => update("qualifyingDetails", "qualifyingExam", e.target.value)} options={["SSLC", "CBSE", "ICSE", "OTHERS"]} required />
                                <SelectGroup id="nativeState" name="nativeState" label="11. Code of the Native State" value={form.qualifyingDetails?.nativeState ?? ""} onChange={(e) => { update("qualifyingDetails", "nativeState", e.target.value); update("qualifyingDetails", "nativeDistrict", ""); }} options={STATES} required />
                                {form.qualifyingDetails?.nativeState === "Karnataka" ? (
                                    <SelectGroup id="nativeDistrict" name="nativeDistrict" label="12. If Karnataka, Code of Native District" value={form.qualifyingDetails?.nativeDistrict ?? ""} onChange={(e) => update("qualifyingDetails", "nativeDistrict", e.target.value)} options={KARNATAKA_DISTRICTS} required />
                                ) : (
                                    <InputGroup id="nativeDistrict" name="nativeDistrict" label="12. Code of Native District" value={form.qualifyingDetails?.nativeDistrict ?? ""} onChange={(e) => update("qualifyingDetails", "nativeDistrict", e.target.value)} required />
                                )}
                            </div>
                        </div>

                        {/* 3. STUDY & ELIGIBILITY */}
                        <SectionHeader icon={Layers} title="Study & Eligibility" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                <SelectGroup id="stateAppearedForQualifyingExam" name="stateAppearedForQualifyingExam" label="13. Code of State appeared for SSLC/Equiv" value={form.studyEligibility?.stateAppearedForQualifyingExam ?? ""} onChange={(e) => update("studyEligibility", "stateAppearedForQualifyingExam", e.target.value)} options={STATES} required />
                                <InputGroup id="yearsStudiedInKarnataka" name="yearsStudiedInKarnataka" label="14. Total No. of Years Studied in Karnataka" type="number" value={form.studyEligibility?.yearsStudiedInKarnataka ?? ""} onChange={(e) => update("studyEligibility", "yearsStudiedInKarnataka", e.target.value)} required />
                                <SelectGroup id="isRural" name="isRural" label="15. Studied in rural areas (1st to 10th)" value={form.studyEligibility?.isRural ?? ""} onChange={(e) => update("studyEligibility", "isRural", e.target.value)} options={["Yes", "No"]} required />
                                <SelectGroup id="isKannadaMedium" name="isKannadaMedium" label="16. Studied in Kannada Medium (1st to 10th)" value={form.studyEligibility?.isKannadaMedium ?? ""} onChange={(e) => update("studyEligibility", "isKannadaMedium", e.target.value)} options={["Yes", "No"]} required />
                            </div>
                        </div>

                        {/* 4. EXEMPTION & CLAIMS */}
                        <SectionHeader icon={Layers} title="Exemption & Claims" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                <SelectGroup id="isFiveYearExemption" name="isFiveYearExemption" label="17. Claiming exemption from 5 years rule" value={form.exemptionClaims?.isFiveYearExemption ?? ""} onChange={(e) => update("exemptionClaims", "isFiveYearExemption", e.target.value)} options={["Yes", "No"]} required />
                                {form.exemptionClaims?.isFiveYearExemption === "Yes" && (
                                    <SelectGroup id="exemptionClause" name="exemptionClause" label="18. If Yes, Mention Clause code" value={form.exemptionClaims?.exemptionClause ?? ""} onChange={(e) => update("exemptionClaims", "exemptionClause", e.target.value)} options={EXEMPTION_CLAUSES} required />
                                )}
                                <SelectGroup id="isHyderabadKarnataka" name="isHyderabadKarnataka" label="19. Claiming Hyd-Kar quota benefit" value={form.exemptionClaims?.isHyderabadKarnataka ?? ""} onChange={(e) => update("exemptionClaims", "isHyderabadKarnataka", e.target.value)} options={["Yes", "No"]} required />
                                <SelectGroup id="isSNQ" name="isSNQ" label="20. Claiming SNQ quota benefit" value={form.exemptionClaims?.isSNQ ?? ""} onChange={(e) => update("exemptionClaims", "isSNQ", e.target.value)} options={["Yes", "No"]} required />
                            </div>
                        </div>

                        {/* 5. SPECIAL CATEGORY */}
                        <SectionHeader icon={Layers} title="Special Category" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <p className="text-xs font-bold mb-3 text-slate-500">21. Do you claiming Special Category benefit (Please Tick the appropriate box)</p>
                            <div className="flex flex-wrap gap-6">
                                {SPECIAL_CATEGORIES_LIST.map((key) => (
                                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" checked={!!form.specialCategory?.[key]} onChange={() => toggleCheck("specialCategory", key)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                        <span className="text-sm font-semibold text-slate-700">{key}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 6. SHIFT DETAILS */}
                        <SectionHeader icon={Layers} title="Shift Details" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <SelectGroup id="shiftType" name="shiftType" label="Shift (Tick appropriately)" value={form.shiftDetails?.shiftType ?? ""} onChange={(e) => update("shiftDetails", "shiftType", e.target.value)} options={["Day Shift", "Evening Shift"]} required />
                            
                            {form.shiftDetails?.shiftType === "Evening Shift" && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-slate-200">
                                    <InputGroup id="experienceYears" name="experienceYears" label="Total service exp (Years)" type="number" value={form.shiftDetails?.experienceYears ?? ""} onChange={(e) => update("shiftDetails", "experienceYears", e.target.value)} required />
                                    <InputGroup id="experienceMonths" name="experienceMonths" label="Total service exp (Months)" type="number" value={form.shiftDetails?.experienceMonths ?? ""} onChange={(e) => update("shiftDetails", "experienceMonths", e.target.value)} required />
                                    <SelectGroup id="serviceCertificate" name="serviceCertificate" label="Service Cert & NOC attached" value={form.shiftDetails?.serviceCertificate ?? ""} onChange={(e) => update("shiftDetails", "serviceCertificate", e.target.value)} options={["Yes", "No"]} required />
                                </div>
                            )}
                        </div>

                        {/* 7. CATEGORY DETAILS */}
                        <SectionHeader icon={Layers} title="Category Details" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <SelectGroup id="hasCertificate" name="hasCertificate" label="22. Has the applicant submitted Income Certificate or Caste Certificate?" value={form.categoryDetails?.hasCertificate ?? ""} onChange={(e) => update("categoryDetails", "hasCertificate", e.target.value)} options={["Yes", "No"]} required={false} className="md:col-span-3" />
                                
                                {form.categoryDetails?.hasCertificate === "No" && (
                                    <SelectGroup id="hasAcknowledgement" name="hasAcknowledgement" label="23. Has the applicant submitted the Acknowledgement Number?" value={form.categoryDetails?.hasAcknowledgement ?? ""} onChange={(e) => update("categoryDetails", "hasAcknowledgement", e.target.value)} options={["Yes", "No"]} required={false} className="md:col-span-3" />
                                )}

                                {form.categoryDetails?.hasAcknowledgement === "Yes" && form.categoryDetails?.hasCertificate === "No" && (
                                    <InputGroup id="acknowledgementNumber" name="acknowledgementNumber" label="24. Enter Acknowledgement Number" value={form.categoryDetails?.acknowledgementNumber ?? ""} onChange={(e) => update("categoryDetails", "acknowledgementNumber", e.target.value)} required={false} className="md:col-span-3" />
                                )}

                                <SelectGroup id="category" name="category" label="25. Reserved Category" value={form.categoryDetails?.category ?? ""} onChange={(e) => update("categoryDetails", "category", e.target.value)} options={CATEGORIES} />
                                <InputGroup id="casteName" name="casteName" label="26. Name of the Caste" value={form.categoryDetails?.casteName ?? ""} onChange={(e) => update("categoryDetails", "casteName", e.target.value.toUpperCase())} required={form.categoryDetails?.category !== "GM"} />
                                <InputGroup id="annualIncome" name="annualIncome" label="27. Annual income from all sources" type="number" value={form.categoryDetails?.annualIncome ?? ""} onChange={(e) => update("categoryDetails", "annualIncome", e.target.value)} required />
                            </div>
                        </div>

                        {/* 8. CONTACT DETAILS & ADDRESS */}
                        <SectionHeader icon={MapPin} title="Contact Details & Address" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                <InputGroup id="mobile" name="mobile" label="28. Student Mobile Number" value={form.contactDetails?.mobile ?? ""} onChange={(e) => update("contactDetails", "mobile", e.target.value.replace(/\D/g, ''))} required maxLength={10} />
                                <InputGroup id="parentMobile" name="parentMobile" label="Parents Mobile Number" value={form.contactDetails?.parentMobile ?? ""} onChange={(e) => update("contactDetails", "parentMobile", e.target.value.replace(/\D/g, ''))} required maxLength={10} />
                                <InputGroup id="email" name="email" label="E-mail ID" type="email" value={form.contactDetails?.email ?? ""} onChange={(e) => update("contactDetails", "email", e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-5 border-t border-slate-200">
                                <InputGroup id="address" name="address" label="Full Postal Address" value={form.contactDetails?.address ?? ""} onChange={(e) => update("contactDetails", "address", e.target.value.toUpperCase())} required className="md:col-span-3" placeholder="BLOCK LETTERS ONLY"/>
                                <SelectGroup id="state" name="state" label="State" value={form.contactDetails?.state ?? ""} onChange={(e) => { update("contactDetails", "state", e.target.value); update("contactDetails", "district", ""); }} options={STATES} required />
                                {form.contactDetails?.state === "Karnataka" ? (
                                    <SelectGroup id="district" name="district" label="District" value={form.contactDetails?.district ?? ""} onChange={(e) => update("contactDetails", "district", e.target.value)} options={KARNATAKA_DISTRICTS} required />
                                ) : (
                                    <InputGroup id="district" name="district" label="District" value={form.contactDetails?.district ?? ""} onChange={(e) => update("contactDetails", "district", e.target.value)} required />
                                )}
                                <InputGroup id="pincode" name="pincode" label="PIN CODE" value={form.contactDetails?.pincode ?? ""} onChange={(e) => update("contactDetails", "pincode", e.target.value.replace(/\D/g, ''))} required maxLength={6} />
                            </div>
                        </div>

                        {/* 9. EDUCATIONAL PARTICULARS (SSLC) */}
                        <SectionHeader icon={BookOpen} title="Educational Particulars & Marks Details" />
                        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5 border-b border-slate-200 pb-5">
                                {/* Disabled SSLC Register Number */}
                                <InputGroup id="sslcRegisterNumber" name="sslcRegisterNumber" label="A) Register Number of SSLC / Equiv" value={form.educationalParticulars?.sslcRegisterNumber ?? ""} onChange={() => {}} disabled={true} className="bg-slate-200 cursor-not-allowed" />
                                <InputGroup id="sslcPassingYear" name="sslcPassingYear" label="Year of Passing" value={form.educationalParticulars?.sslcPassingYear ?? ""} onChange={(e) => update("educationalParticulars", "sslcPassingYear", e.target.value)} required />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <InputGroup id="sslcMaxMarks" name="sslcMaxMarks" label="1) Total Max Marks in all subjects" type="number" value={form.educationalParticulars?.sslcMaxMarks ?? ""} onChange={(e) => update("educationalParticulars", "sslcMaxMarks", e.target.value)} required />
                                <InputGroup id="sslcObtainedMarks" name="sslcObtainedMarks" label="Total Marks obtained" type="number" value={form.educationalParticulars?.sslcObtainedMarks ?? ""} onChange={(e) => update("educationalParticulars", "sslcObtainedMarks", e.target.value)} required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <InputGroup id="maxScienceMarks" name="maxScienceMarks" label="2) Max. Marks in Science" type="number" value={form.educationalParticulars?.maxScienceMarks ?? ""} onChange={(e) => update("educationalParticulars", "maxScienceMarks", e.target.value)} required />
                                <InputGroup id="obtainedScienceMarks" name="obtainedScienceMarks" label="Marks obtained (Science)" type="number" value={form.educationalParticulars?.obtainedScienceMarks ?? ""} onChange={(e) => update("educationalParticulars", "obtainedScienceMarks", e.target.value)} required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                                <InputGroup id="maxMathsMarks" name="maxMathsMarks" label="3) Max. Marks in Maths" type="number" value={form.educationalParticulars?.maxMathsMarks ?? ""} onChange={(e) => update("educationalParticulars", "maxMathsMarks", e.target.value)} required />
                                <InputGroup id="obtainedMathsMarks" name="obtainedMathsMarks" label="Marks obtained (Maths)" type="number" value={form.educationalParticulars?.obtainedMathsMarks ?? ""} onChange={(e) => update("educationalParticulars", "obtainedMathsMarks", e.target.value)} required />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Auto Computed fields, Disabled */}
                                <InputGroup id="totalMaxScienceMaths" name="totalMaxScienceMaths" label="4) Total Max. Marks in Science & Maths" type="text" value={form.educationalParticulars?.totalMaxScienceMaths ?? ""} onChange={() => {}} required={false} disabled={true} className="bg-slate-100" />
                                <InputGroup id="totalObtainedScienceMaths" name="totalObtainedScienceMaths" label="Total Marks obtained in Science & Maths" type="text" value={form.educationalParticulars?.totalObtainedScienceMaths ?? ""} onChange={() => {}} required={false} disabled={true} className="bg-slate-100" />
                            </div>
                        </div>

                        {/* 10. DECLARATION */}
                        <SectionHeader icon={CheckCircle} title="Verification Declaration" />
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-10 shadow-sm">
                            <div className="flex items-start gap-3 mb-6 border-b border-yellow-200 pb-6">
                                <input type="checkbox" id="declaration" name="declaration" checked={declarationChecked ?? false} onChange={(e) => setDeclarationChecked(e.target.checked)} className="mt-1.5 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer" />
                                <label htmlFor="declaration" className="text-sm font-bold text-slate-800 cursor-pointer select-none leading-relaxed italic">
                                    I confirm that all edits have been verified against original documents provided by the applicant. We declare that the above information is true and correct to the best our knowledge and belief. In case if any of the above information is found to be false or incorrect, we shall forfeit the claim to be considered for a seat in a polytechnic.
                                </label>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <InputGroup id="candidateSignatureText" name="candidateSignatureText" label="Verifying Officer / Candidate Signature (Type Name)" value={form.declaration?.candidateSignatureText ?? ""} onChange={(e) => update("declaration", "candidateSignatureText", e.target.value)} required placeholder="Type Full Name" />
                                <InputGroup id="parentSignatureText" name="parentSignatureText" label="Parent's Verified Name" value={form.declaration?.parentSignatureText ?? ""} onChange={(e) => update("declaration", "parentSignatureText", e.target.value)} required placeholder="Type Full Name" />
                            </div>
                        </div>

                        {/* SUBMIT BUTTONS */}
                        <div className="flex flex-col md:flex-row gap-4 justify-center">
                            <button onClick={() => setIsEditing(false)} className="px-8 py-4 rounded-lg font-bold text-slate-600 hover:bg-slate-200 border border-slate-300 transition-all">
                                Discard Changes
                            </button>
                            <button onClick={submitUpdate} disabled={submitting} className={`flex-1 md:max-w-md px-6 py-4 rounded-lg font-bold text-lg text-white shadow-lg flex items-center justify-center gap-2 transition-all ${submitting ? "bg-slate-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 active:scale-95"}`}>
                                {submitting ? <><Loader2 className="animate-spin w-6 h-6" /> Updating...</> : <><CheckCircle className="w-6 h-6" /> Save & Update Records</>}
                            </button>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
