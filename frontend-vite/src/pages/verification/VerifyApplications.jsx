import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, ChevronDown, ChevronUp, User, Phone, 
  Mail, GraduationCap, FileText, 
  AlertCircle, CheckCircle2, XCircle, FileBadge, 
  ShieldCheck, Loader2, ExternalLink
} from "lucide-react";
import FullPageLoader from "../../components/FullPageLoader";

const TABS = [
  { id: "SUBMITTED", label: "Pending", bgColor: "bg-blue-50", textColor: "text-blue-700", borderColor: "border-blue-200" },
  { id: "VERIFIED", label: "Verified", bgColor: "bg-emerald-50", textColor: "text-emerald-700", borderColor: "border-emerald-200" },
  { id: "CORRECTION_REQUIRED", label: "Correction", bgColor: "bg-amber-50", textColor: "text-amber-700", borderColor: "border-amber-200" },
  { id: "REJECTED", label: "Rejected", bgColor: "bg-rose-50", textColor: "text-rose-700", borderColor: "border-rose-200" },
];

const StatusBadge = ({ status }) => {
  const tab = TABS.find(t => t.id === status) || TABS[0];
  return (
    <span className={`px-3 py-1 text-[11px] font-bold rounded border uppercase tracking-wider ${tab.bgColor} ${tab.textColor} ${tab.borderColor}`}>
      {status.replace("_", " ")}
    </span>
  );
};

export default function VerificationPage() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("SUBMITTED");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState(null);
  const [fetching, setFetching] = useState(true);

  const fetchApplications = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/verification/applications`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: activeTab, search },
        }
      );
      setApplications(res.data.applications || []);
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setFetching(false);
    }
  }, [activeTab, search, getToken]);

  useEffect(() => {
    const t = setTimeout(fetchApplications, 400);
    return () => clearTimeout(t);
  }, [fetchApplications]);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8 font-sans antialiased text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* PROFESSIONAL HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-800 rounded-lg text-white">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verification Center</h2>
              <p className="text-sm text-slate-500">Official Registrar Review Panel</p>
            </div>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by ID or Name..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {/* CLEAN TABS */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap border
                ${activeTab === t.id 
                  ? "bg-slate-800 text-white border-slate-800 shadow-sm" 
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            >
              {t.label} <span className="ml-1 opacity-50 text-xs font-normal">({activeTab === t.id ? applications.length : "•"})</span>
            </button>
          ))}
        </div>

        {/* LIST SECTION */}
        <div className="space-y-4">
          {fetching ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>
          ) : applications.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-400 font-medium">No pending applications found.</p>
            </div>
          ) : (
            applications.map((app, index) => (
              <ApplicationCard
                key={app._id}
                app={app}
                isOpen={openId === app._id}
                toggle={() => setOpenId(openId === app._id ? null : app._id)}
                refresh={fetchApplications}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ApplicationCard({ app, isOpen, toggle, refresh }) {
  const { getToken } = useAuth();
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [checklist, setChecklist] = useState({
    sslcMarksCard: false,
    aadhaarCard: false,
    transferCertificate: false,
    studyCertificate: false,
    casteCertificate: false,
    ruralCertificate: false,
    kannadaCertificate: false,
  });

  const mandatoryDocs = checklist.sslcMarksCard && checklist.aadhaarCard && checklist.transferCertificate && checklist.studyCertificate;
  const examValid = app.examDetails?.score !== undefined;
  const canVerify = mandatoryDocs && examValid;

  const handleAction = async (actionType) => {
    try {
      const token = await getToken();
      setLoading(true);
      const criticalDocs = ["sslcMarksCard", "aadhaarCard", "transferCertificate", "studyCertificate"];
      let failedDocs = [];

      if (actionType === "CORRECTION_REQUIRED") {
        failedDocs = Object.keys(checklist).filter(doc => !checklist[doc] && !criticalDocs.includes(doc));
        if (failedDocs.length === 0) {
          toast.error("Select minor issue for correction");
          setLoading(false); return;
        }
      } else if (actionType === "REJECTED") {
        failedDocs = criticalDocs;
      }

      await axios.patch(`${import.meta.env.VITE_API_URL}/verification/applications/${app._id}`,
        { failedDocs, remarks }, { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Marked as ${actionType}`);
      refresh();
    } catch { toast.error("Action failed"); } finally { setLoading(false); }
  };

  return (
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all duration-200 ${isOpen ? 'ring-1 ring-slate-400' : 'hover:border-slate-300'}`}>
      
      {/* LOADER OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-slate-800" size={32} />
            <p className="text-sm font-bold text-slate-700">Updating Record...</p>
          </div>
        </div>
      )}

      {/* HEADER ROW */}
      <div onClick={toggle} className="flex items-center justify-between p-5 cursor-pointer select-none">
        <div className="flex items-center gap-4">
          {app.personalDetails?.photo ? (
            <img src={app.personalDetails.photo} alt="Student" className="w-14 h-14 rounded-lg object-cover border border-slate-200 shadow-sm" />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xl">
              {app.personalDetails?.name?.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-900">{app.personalDetails?.name}</h3>
            <div className="text-xs text-slate-500 font-medium flex gap-4 mt-1">
              <span className="flex items-center gap-1"><Phone size={12}/> {app.personalDetails?.mobile}</span>
              <span className="flex items-center gap-1 uppercase">ID: {app._id.slice(-6)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge status={app.status} />
          {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-slate-100 p-6 bg-gray-50/30 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* INFO COLUMN */}
          <div className="space-y-6">
            <InfoSection icon={<User size={16}/>} title="Personal Record">
              <DataLabel label="Father's Name" value={app.personalDetails?.fatherName} />
              <DataLabel label="DOB" value={app.personalDetails?.dob?.split("T")[0]} />
              <DataLabel label="Address" value={app.personalDetails?.address} full />
            </InfoSection>

            <InfoSection icon={<GraduationCap size={16}/>} title="Academic Record">
              <DataLabel label="Reg Number" value={app.academicDetails?.sslcRegisterNumber} />
              <DataLabel label="SSLC Marks" value={`${app.academicDetails?.obtainedMarks} / ${app.academicDetails?.maxMarks}`} />
              <DataLabel label="Math/Sci" value={`${app.academicDetails?.mathsMarks} / ${app.academicDetails?.scienceMarks}`} />
            </InfoSection>

            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Verification Checklist</h4>
              
              {/* Mandatory Section */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-blue-600 uppercase">A. Mandatory Documents</p>
                {[{id:"sslcMarksCard", l:"SSLC Marks Card"}, {id:"aadhaarCard", l:"Aadhaar Card"}, {id:"transferCertificate", l:"Transfer Certificate"}, {id:"studyCertificate", l:"Study Certificate"}].map(item => (
                  <CheckItem key={item.id} id={item.id} label={item.l} checklist={checklist} setChecklist={setChecklist} />
                ))}
              </div>

              {/* Reservation Section (Optional) */}
              {(app.categoryDetails?.isKannadaMedium || app.categoryDetails?.isRural || app.categoryDetails?.category !== "GM") && (
                <div className="space-y-2 pt-2 border-t border-dashed">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">B. Reservation Documents</p>
                  {app.categoryDetails?.category !== "GM" && <CheckItem id="casteCertificate" label="Caste Certificate" checklist={checklist} setChecklist={setChecklist} />}
                  {app.categoryDetails?.isRural && <CheckItem id="ruralCertificate" label="Rural Certificate" checklist={checklist} setChecklist={setChecklist} />}
                  {app.categoryDetails?.isKannadaMedium && <CheckItem id="kannadaCertificate" label="Kannada Certificate" checklist={checklist} setChecklist={setChecklist} />}
                </div>
              )}
            </div>
          </div>

          {/* ACTION COLUMN */}
          <div className="space-y-6">
            <InfoSection icon={<FileText size={16}/>} title="Digital Vault">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {app.documents && Object.entries(app.documents).map(([name, url]) => (
                  <div key={name} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg text-xs">
                    <span className="font-bold text-slate-600 capitalize truncate pr-2">{name.replace(/([A-Z])/g, ' $1')}</span>
                    <a href={url} target="_blank" rel="noreferrer" className="shrink-0 px-2 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors font-semibold">View</a>
                  </div>
                ))}
              </div>
            </InfoSection>

            {/* EXAM METRIC */}
            <div className={`p-5 rounded-xl border ${examValid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Entrance Test Metric</h4>
              {examValid ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{app.examDetails.score} <span className="text-sm font-normal text-slate-400">/ {app.examDetails.totalQuestions}</span></p>
                    <p className="text-xs font-bold text-emerald-600 mt-1">Percentage: {app.examDetails.percentage}%</p>
                  </div>
                  <div className="w-24 h-2 bg-emerald-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${app.examDetails.percentage}%` }} />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-rose-600 font-bold italic">Entrance data missing / not attempted</p>
              )}
            </div>

            {/* ACTION SUITE */}
            <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Final Review</h4>
              <textarea
                placeholder="Enter official remarks..."
                className="w-full border rounded-lg p-3 text-sm focus:ring-1 focus:ring-slate-400 outline-none bg-slate-50"
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              {!canVerify && (
                <p className="text-[10px] font-bold text-rose-500 bg-rose-50 p-2 rounded border border-rose-100 flex items-center gap-2">
                  <AlertCircle size={14}/> MANDATORY DOCUMENT REVIEW REQUIRED BEFORE VERIFICATION
                </p>
              )}

              <div className="grid grid-cols-3 gap-3">
                <button disabled={!canVerify} onClick={() => handleAction("VERIFIED")} className="py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-30 transition-all">Verify</button>
                <button onClick={() => handleAction("CORRECTION_REQUIRED")} className="py-2.5 bg-amber-500 text-white rounded-lg text-xs font-bold hover:bg-amber-600 transition-all">Correction</button>
                <button onClick={() => handleAction("REJECTED")} className="py-2.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all">Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SHARED COMPONENTS
const InfoSection = ({ icon, title, children }) => (
  <div className="bg-white border rounded-xl p-5 shadow-sm space-y-4">
    <div className="flex items-center gap-2 border-b pb-2">
      <span className="text-slate-400">{icon}</span>
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="grid grid-cols-2 gap-4">{children}</div>
  </div>
);

const DataLabel = ({ label, value, full }) => (
  <div className={full ? "col-span-2" : ""}>
    <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-sm font-semibold text-slate-800 break-words">{value || "N/A"}</p>
  </div>
);

const CheckItem = ({ id, label, checklist, setChecklist }) => (
  <label className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
    <span className="text-xs font-semibold text-slate-600">{label}</span>
    <input
      type="checkbox"
      className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-0"
      checked={checklist[id]}
      onChange={() => setChecklist(prev => ({ ...prev, [id]: !prev[id] }))}
    />
  </label>
);