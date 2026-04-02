import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FaSearch, 
  FaUserCheck, 
  FaTimesCircle, 
  FaCheckCircle, 
  FaClipboardList,
  FaHourglassHalf
} from "react-icons/fa";

export default function PhysicalVerification() {
  const { getToken } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState("PENDING"); 
  const [searchTerm, setSearchTerm] = useState("");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [remarks, setRemarks] = useState("");

  // Fetch Data
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/physical-verification/list`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: activeTab, search: searchTerm }
        }
      );
      setApplications(res.data.applications);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Debounce Search & Tab Change
  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 500);
    return () => clearTimeout(timer);
  }, [activeTab, searchTerm]);

  // Handle Verify Action
  const handleVerify = async (verified) => {
  if (!selectedStudent) return;

  let failedDocs = [];

  // ❌ if clicked FAIL button
  if (!verified) {
    failedDocs = ["sslc"]; // treat as critical fail
  } else {
    if (!checklist.marksCard) failedDocs.push("sslc");
    if (!checklist.incomeCert) failedDocs.push("caste");
    if (!checklist.studyCert) failedDocs.push("rural");
  }

  try {
    const token = await getToken();

    await axios.patch(
      `${import.meta.env.VITE_API_URL}/physical-verification/verify/${selectedStudent._id}`,
      { failedDocs, remarks },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    toast.success("Verification completed");
    setSelectedStudent(null);
    setRemarks("");
    fetchStudents();

  } catch {
    toast.error("Failed");
  }
};

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gray-50">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Admission Counter</h2>
          <p className="text-gray-500 text-sm">Verify original documents and forward for Final Approval</p>
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search Name, Mobile or Aadhar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 border-b overflow-x-auto">
        {["PENDING", "VERIFIED", "FAILED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab 
                ? "border-indigo-600 text-indigo-600 bg-indigo-50" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab === "PENDING" ? "Queue (Pending)" : tab === "VERIFIED" ? "Verified (Ready)" : "Rejected"}
          </button>
        ))}
      </div>

      {/* LIST */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading records...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed">
          <p className="text-gray-500">No records found in this category.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((app) => (
            <StudentCard 
              key={app._id} 
              app={app} 
              onVerify={() => setSelectedStudent(app)} 
              isPending={activeTab === "PENDING"}
            />
          ))}
        </div>
      )}

      {/* VERIFICATION MODAL */}
      {selectedStudent && (
        <VerificationModal 
          student={selectedStudent} 
          onClose={() => setSelectedStudent(null)}
          onConfirm={handleVerify}
          remarks={remarks}
          setRemarks={setRemarks}
        />
      )}
    </div>
  );
}

/* ================= COMPONENT: STUDENT CARD ================= */
function StudentCard({ app, onVerify, isPending }) {
  // Helper for Status Badges
  const getStatusBadge = (status) => {
      // 🟡 Intermediate State (Verified by you, waiting for Principal)
      if (status === "DOCUMENTS_VERIFIED") return (
          <div className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 bg-yellow-100 text-yellow-800 border border-yellow-200">
             <FaHourglassHalf /> Waiting Approval
          </div>
      );
      // 🔴 Failed
      if (status === "DOCUMENTS_FAILED") return (
          <div className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 bg-red-100 text-red-700 border border-red-200">
             <FaTimesCircle /> Failed
          </div>
      );
      // 🟢 Fully Admitted (If showing history)
      if (status === "ADMITTED") return (
          <div className="px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 bg-green-100 text-green-700 border border-green-200">
             <FaUserCheck /> Admitted
          </div>
      );
      return null;
  };

  return (
    <div className="bg-white p-5 rounded-lg border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition">
      
      {/* LEFT: INFO */}
      <div className="flex gap-4 items-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden border">
             {app.personalDetails?.photo ? (
                <img src={app.personalDetails.photo} alt="" className="w-full h-full object-cover" />
             ) : (
                <div className="flex items-center justify-center h-full text-xs text-gray-500">No Photo</div>
             )}
        </div>
        <div>
          <h3 className="font-bold text-lg text-gray-900">{app.personalDetails?.name}</h3>
          <p className="text-sm text-gray-500">
             Allotted: <span className="font-semibold text-indigo-600">{app.allottedBranch}</span> • 
             Rank: <span className="font-semibold">{app.rank}</span>
          </p>
          <div className="flex gap-2 mt-1 text-xs text-gray-400">
            <span>Cat: {app.categoryDetails?.category}</span>
            <span>•</span>
            <span>Mobile: {app.personalDetails?.mobile}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: ACTION */}
      {isPending ? (
        <button 
          onClick={onVerify}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition flex items-center gap-2"
        >
          <FaClipboardList /> Verify Documents
        </button>
      ) : (
        getStatusBadge(app.status)
      )}
    </div>
  );
}

/* ================= COMPONENT: VERIFICATION MODAL ================= */
function VerificationModal({ student, onClose, onConfirm, remarks, setRemarks }) {
  const [checklist, setChecklist] = useState({
    marksCard: false,
    tc: false,
    photos: false,
    incomeCert: false,
    studyCert: false
  });

  const allChecked = Object.values(checklist).every(Boolean);

  const toggleCheck = (key) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4">
        
        {/* HEADER */}
        <div className="bg-gray-100 px-6 py-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <FaUserCheck className="text-indigo-600" /> Physical Verification
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* LEFT: STUDENT SUMMARY */}
            <div className="space-y-4 text-sm">
                <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-2">Student Profile</h4>
                <InfoRow label="Name" value={student.personalDetails?.name} />
                <InfoRow label="Aadhar" value={student.personalDetails?.aadharNumber} />
                <InfoRow label="SSLC Reg" value={student.academicDetails?.sslcRegisterNumber} />
                <InfoRow label="Category" value={student.categoryDetails?.category} />
                
                <div className="p-3 bg-indigo-50 rounded border border-indigo-100 mt-4">
                    <p className="text-xs text-indigo-600 font-bold uppercase">Allotted Seat</p>
                    <p className="text-lg font-bold text-indigo-900">{student.allottedBranch}</p>
                </div>
            </div>

            {/* RIGHT: CHECKLIST */}
            <div>
                <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider mb-3">Check Original Docs</h4>
                <div className="space-y-2">
                    <CheckItem label="SSLC / 10th Marks Card" checked={checklist.marksCard} onChange={() => toggleCheck('marksCard')} />
                    <CheckItem label="Transfer Certificate (TC)" checked={checklist.tc} onChange={() => toggleCheck('tc')} />
                    <CheckItem label="Passport Size Photos (2)" checked={checklist.photos} onChange={() => toggleCheck('photos')} />
                    <CheckItem label="Study Certificate (7 Years)" checked={checklist.studyCert} onChange={() => toggleCheck('studyCert')} />
                    {(student.categoryDetails?.category !== "GM") && (
                        <CheckItem label="Caste & Income Certificate" checked={checklist.incomeCert} onChange={() => toggleCheck('incomeCert')} />
                    )}
                </div>
            </div>
        </div>

        {/* REMARKS & ACTIONS */}
        <div className="p-6 border-t bg-gray-50">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Officer Remarks</label>
            <textarea 
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full border rounded p-2 text-sm mb-4 h-20 outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter comments (e.g. 'TC pending', 'Fees Paid')..."
            />

            <div className="flex gap-3">
                <button 
                    onClick={() => onConfirm(false)}
                    className="flex-1 py-3 border border-red-200 text-red-700 bg-white hover:bg-red-50 rounded-lg font-medium transition"
                >
                    Reject / Fail
                </button>
                <button 
                    onClick={() => onConfirm(true)}
                    disabled={!allChecked}
                    className={`flex-1 py-3 text-white rounded-lg font-bold shadow-md transition flex items-center justify-center gap-2 ${
                        allChecked ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-400 cursor-not-allowed"
                    }`}
                >
                    {allChecked ? <><FaCheckCircle/> Submit for Approval</> : "Check all items to proceed"}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}

/* Helpers */
function InfoRow({ label, value }) {
    return <div className="flex justify-between border-b border-gray-100 py-2">
        <span className="text-gray-500">{label}:</span>
        <span className="font-medium text-gray-900">{value || "-"}</span>
    </div>
}

function CheckItem({ label, checked, onChange }) {
    return (
        <label className={`flex items-center gap-3 p-3 rounded border cursor-pointer transition ${checked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
            <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 text-green-600 rounded focus:ring-green-500" />
            <span className={`text-sm ${checked ? 'text-green-800 font-medium' : 'text-gray-700'}`}>{label}</span>
        </label>
    );
}