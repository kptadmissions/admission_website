import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSync } from "react-icons/fa";
import FullPageLoader from "../../components/FullPageLoader";
// Define Tab Categories
const TABS = [
  { id: "SUBMITTED", label: "Pending" },
  { id: "VERIFIED", label: "Verified" },
  { id: "CORRECTION_REQUIRED", label: "Corrections" },
  { id: "REJECTED", label: "Rejected" },
];

// Helper to format Date
const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN");
};

// Helper to format Status
const formatStatus = (status) => {
  if (!status) return "-";
  return status.replace(/_/g, " ");
};

export default function VerifyApplications() {
  const { getToken } = useAuth();
  
  // State
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("SUBMITTED"); // Default to Pending
  const [searchTerm, setSearchTerm] = useState("");
  const [remarksMap, setRemarksMap] = useState({});
  const [openId, setOpenId] = useState(null);

  // Debounce helper for search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchApplications();
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab]); // Re-fetch when search or tab changes

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/verification/applications`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            status: activeTab,
            search: searchTerm,
          },
        }
      );
      setApplications(res.data.applications);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const token = await getToken();

      if (status === "CORRECTION_REQUIRED" && !remarksMap[id]?.trim()) {
        toast.error("Remarks are required for correction");
        return;
      }

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/verification/applications/${id}`,
        { status, remarks: remarksMap[id] || "" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Application updated to ${formatStatus(status)}`);
      
      // Remove the item from the current list (UI Optimistic Update)
      setApplications((prev) => prev.filter((app) => app._id !== id));
      
      setRemarksMap((prev) => {
        const newMap = { ...prev };
        delete newMap[id];
        return newMap;
      });
      setOpenId(null);
    } catch {
      toast.error("Action failed");
    }
  };
if (loading) {
  return <FullPageLoader label="Loading applications..." />;
}
return (
  <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gray-50">

    {/* HEADER */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Application Verification</h2>
        <p className="text-gray-500 text-sm">Manage student applications and status</p>
      </div>

      {/* SEARCH + REFRESH */}
      <div className="w-full md:w-auto flex gap-2 items-center">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search by Name, Mobile or SSLC Reg No..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />

          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        <button
          onClick={fetchApplications}
          className="p-2.5 bg-white border border-gray-300 rounded-lg text-gray-600 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm"
        >
          <FaSync className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>

    {/* TABS */}
    <div className="flex border-b mb-6 overflow-x-auto">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            setOpenId(null);
          }}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
            activeTab === tab.id
              ? "border-b-2 border-indigo-600 text-indigo-600"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>

    {/* APPLICATION LIST */}
    <div className="space-y-4">
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">
            No {formatStatus(activeTab).toLowerCase()} applications found.
          </p>
        </div>
      ) : (
        applications.map((app) => (
          <ApplicationCard
            key={app._id}
            app={app}
            openId={openId}
            setOpenId={setOpenId}
            remarksMap={remarksMap}
            setRemarksMap={setRemarksMap}
            updateStatus={updateStatus}
            currentTab={activeTab}
          />
        ))
      )}
    </div>

  </div>
);
}

/* ================= COMPONENT: CARD ================= */
function ApplicationCard({ app, openId, setOpenId, remarksMap, setRemarksMap, updateStatus, currentTab }) {
  const isOpen = openId === app._id;

  // Determine badge color based on status
  const getStatusBadge = (status) => {
      switch(status) {
          case 'VERIFIED': return 'bg-green-100 text-green-700';
          case 'REJECTED': return 'bg-red-100 text-red-700';
          case 'CORRECTION_REQUIRED': return 'bg-yellow-100 text-yellow-700';
          default: return 'bg-blue-100 text-blue-700';
      }
  };

  return (
    <div className={`border rounded-lg bg-white shadow-sm transition-all ${isOpen ? 'ring-2 ring-indigo-500 border-transparent' : 'hover:border-indigo-300'}`}>
      
      {/* HEADER (Always Visible) */}
      <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setOpenId(isOpen ? null : app._id)}>
        {/* Photo Thumbnail */}
        <div className="w-12 h-12 md:w-16 md:h-16 border rounded bg-gray-100 flex-shrink-0 overflow-hidden">
          {app?.personalDetails?.photo ? (
            <img src={app.personalDetails.photo} alt="Student" className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-400">N/A</div>
          )}
        </div>

        {/* Basic Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{app?.personalDetails?.name || "Unknown Applicant"}</h3>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(app?.status)}`}>
                  {formatStatus(app?.status)}
              </span>
              {app?.admissionType && (
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                    {app.admissionType}
                </span>
              )}
          </div>
          <div className="text-sm text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
              <span>SSLC: <span className="text-gray-700 font-medium">{app?.academicDetails?.sslcPercentage || '-'}%</span></span>
              <span>•</span>
              <span>Cat: <span className="text-gray-700 font-medium">{app?.categoryDetails?.category || '-'}</span></span>
              <span>•</span>
              <span>Mobile: {app?.personalDetails?.mobile || '-'}</span>
          </div>
        </div>

        {/* Toggle Button */}
        <button className="hidden md:block text-indigo-600 text-sm font-medium hover:underline">
          {isOpen ? "Close" : "Review"}
        </button>
      </div>

      {/* EXPANDED DETAILS */}
      {isOpen && (
        <div className="border-t bg-gray-50 p-6 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Data Display & Documents */}
            <div className="space-y-6">
                <Section title="Personal Information">
                    <Info label="Full Name" value={app?.personalDetails?.name} />
                    <Info label="Father's Name" value={app?.personalDetails?.fatherName} />
                    <Info label="Mother's Name" value={app?.personalDetails?.motherName} />
                    <Info label="Gender" value={app?.personalDetails?.gender} />
                    <Info label="Date of Birth" value={formatDate(app?.personalDetails?.dob)} />
                    <Info label="Mobile" value={app?.personalDetails?.mobile} />
                    <Info label="Email" value={app?.personalDetails?.email} />
                    <Info label="Address" value={app?.personalDetails?.address} />
                    <Info label="District" value={app?.personalDetails?.district} />
                    <Info label="State" value={app?.personalDetails?.state} />
                    <Info label="Pincode" value={app?.personalDetails?.pincode} />
                    <Info label="Aadhaar" value={app?.personalDetails?.aadharNumber} />
                </Section>

                <Section title="Academic Details">
                    <Info label="SSLC Reg No" value={app?.academicDetails?.sslcRegisterNumber} />
                    <Info label="SSLC Passing Year" value={app?.academicDetails?.sslcPassingYear} />
                    <Info label="SSLC Percentage" value={app?.academicDetails?.sslcPercentage ? `${app.academicDetails.sslcPercentage}%` : '-'} />
                    <Info label="SSLC Science Marks" value={app?.academicDetails?.sslcScienceMarks} />
                    <Info label="SSLC Maths Marks" value={app?.academicDetails?.sslcMathsMarks} />
                    
                    {(app?.academicDetails?.itiPucRegisterNumber || app?.academicDetails?.itiPucPassingYear || app?.academicDetails?.itiPucPercentage) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Info label="ITI/PUC Reg No" value={app?.academicDetails?.itiPucRegisterNumber} />
                        <Info label="ITI/PUC Passing Year" value={app?.academicDetails?.itiPucPassingYear} />
                        <Info label="ITI/PUC Percentage" value={app?.academicDetails?.itiPucPercentage ? `${app.academicDetails.itiPucPercentage}%` : '-'} />
                      </div>
                    )}
                </Section>

                <Section title="Uploaded Documents">
                    <DocumentRow label="Candidate Signature" url={app?.documents?.candidateSignature} />
                    <DocumentRow label="Parent Signature" url={app?.documents?.parentSignature} />
                    <DocumentRow label="SSLC Marks Card" url={app?.documents?.sslcMarksCard} />
                    <DocumentRow label="ITI Marks Card" url={app?.documents?.itiMarksCard} />
                    <DocumentRow label="PUC Marks Card" url={app?.documents?.pucMarksCard} />
                    <DocumentRow label="Aadhaar Card" url={app?.documents?.aadhaarCard} />
                    <DocumentRow label="Caste Certificate" url={app?.documents?.casteCertificate} />
                    <DocumentRow label="Income Certificate" url={app?.documents?.incomeCertificate} />
                    <DocumentRow label="Rural Certificate" url={app?.documents?.ruralCertificate} />
                    <DocumentRow label="Kannada Certificate" url={app?.documents?.kannadaCertificate} />
                    <DocumentRow label="Study Exemption Certificate" url={app?.documents?.studyExemptionCertificate} />
                </Section>
            </div>

            {/* Right Column: Category, Verification History, Actions */}
            <div className="space-y-6">
                <Section title="Branch Preferences">
                    {app?.branchPreferences && app.branchPreferences.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mt-1">
                          {app.branchPreferences.map((b, i) => (
                              <span key={b} className="px-2 py-1 bg-white border rounded text-xs text-gray-700 font-medium shadow-sm">
                                  {i+1}. {b}
                              </span>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No branch preferences</p>
                    )}
                </Section>

                <Section title="Category & Reservation">
                    <Info label="Category" value={app?.categoryDetails?.category} />
                    <Info label="Caste Name" value={app?.categoryDetails?.casteName} />
                    <Info label="Annual Income" value={app?.categoryDetails?.annualIncome ? `₹${app.categoryDetails.annualIncome}` : '-'} />
                    <div className="flex gap-2 mt-2">
                        {app?.categoryDetails?.isRural && <Badge>Rural</Badge>}
                        {app?.categoryDetails?.isKannadaMedium && <Badge>Kannada Medium</Badge>}
                    </div>
                </Section>

                <div className="bg-white p-4 rounded-lg border shadow-sm sticky top-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Verification Action</h4>
                    
                    <label className="block text-sm text-gray-600 mb-1">
                      Remarks <span className="text-gray-400 text-xs">(Required for correction/rejection)</span>
                    </label>
                    <textarea 
                        value={remarksMap[app._id] !== undefined ? remarksMap[app._id] : (app?.remarks || "")}
                        onChange={(e) => setRemarksMap(prev => ({ ...prev, [app._id]: e.target.value }))}
                        className="w-full border rounded-lg p-3 text-sm mb-4 h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-gray-50 focus:bg-white transition-colors"
                        placeholder="Enter comments here..."
                    />

                    <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                        <ActionButton 
                            onClick={() => updateStatus(app._id, "VERIFIED")} 
                            color="bg-green-600 hover:bg-green-700"
                            disabled={currentTab === 'VERIFIED'}
                        >
                            {currentTab === 'VERIFIED' ? 'Already Verified' : 'Approve'}
                        </ActionButton>

                        <ActionButton 
                            onClick={() => updateStatus(app._id, "CORRECTION_REQUIRED")} 
                            color="bg-yellow-500 hover:bg-yellow-600"
                        >
                            Correction
                        </ActionButton>

                        <ActionButton 
                            onClick={() => updateStatus(app._id, "REJECTED")} 
                            color="bg-red-600 hover:bg-red-700"
                            disabled={currentTab === 'REJECTED'}
                        >
                             {currentTab === 'REJECTED' ? 'Already Rejected' : 'Reject'}
                        </ActionButton>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= HELPERS ================= */
function Section({ title, children }) {
    return (
        <div className="pb-4 border-b border-gray-200 last:border-0">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{title}</h4>
            <div className="grid grid-cols-1 gap-y-2">
                {children}
            </div>
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div className="flex justify-between items-start text-sm">
            <span className="text-gray-500 mr-4">{label}:</span>
            <span className="font-medium text-gray-900 text-right break-words">{value || "-"}</span>
        </div>
    );
}

function DocumentRow({ label, url }) {

  const openDocument = () => {
    if (!url) return;

    // ✅ detect pdf
    if (url.toLowerCase().endsWith(".pdf")) {
      const fixedUrl = url.replace("/upload/", "/upload/fl_attachment/");
      window.open(fixedUrl, "_blank");
    } else {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
      <span className="text-gray-600">{label}</span>

      {url ? (
        <button
          onClick={openDocument}
          className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800 rounded text-xs font-semibold transition-colors border border-indigo-200"
        >
          View
        </button>
      ) : (
        <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded border border-red-100">
          Not Uploaded
        </span>
      )}
    </div>
  );
}

function Badge({ children }) {
    return <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded font-medium">{children}</span>;
}

function ActionButton({ onClick, color, children, disabled }) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            className={`flex-1 py-2 px-4 rounded-lg text-white font-medium text-sm transition-all shadow-sm ${disabled ? 'bg-gray-300 cursor-not-allowed text-gray-500 shadow-none' : color}`}
        >
            {children}
        </button>
    );
}