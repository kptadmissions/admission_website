import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { 
  LayoutDashboard, 
  FileText, 
  CheckCircle, 
  Download, 
  AlertTriangle, 
  Loader2, 
  Award, 
  ArrowRight,
  Info,
  Check
} from "lucide-react";
import { motion } from "framer-motion";
import FullPageLoader from "../../components/FullPageLoader";

export default function StudentDashboard() {
  const { getToken } = useAuth();

  const [application, setApplication] = useState(null);
  const [seat, setSeat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [admission, setAdmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const setRes = await axios.get(`${import.meta.env.VITE_API_URL}/admission/settings`);
      setAdmission(setRes.data);

      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setApplication(res.data.application || null);

      if (res.data.application?.status === "SEAT_ALLOTTED" || res.data.application?.status === "SEAT_ACCEPTED") {
        const seatRes = await axios.get(`${import.meta.env.VITE_API_URL}/student/seat`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSeat(seatRes.data.seat);
      }
    } catch {
      toast.error("Dashboard load failed");
    } finally {
      setLoading(false);
    }
  };

  const respondSeat = async (resp) => {
    if (!confirm(`Confirm ${resp}?`)) return;
    setActionLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${import.meta.env.VITE_API_URL}/student/seat/respond`, 
        { response: resp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Seat updated");
      load();
    } finally {
      setActionLoading(false);
    }
  };

  const downloadAdmissionPDF = async () => {
    setPdfLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/pdf/admission`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "AdmissionOrder.pdf";
      a.click();
    } catch (error) {
      toast.error("Failed to download Admission Order");
    } finally {
      setPdfLoading(false);
    }
  };

  const downloadAcknowledgementPDF = async () => {
    setPdfLoading(true);
    try {
      const token = await getToken();
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/pdf/acknowledgement`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob"
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "ApplicationAcknowledgement.pdf";
      a.click();
    } catch (error) {
      toast.error("Failed to download Acknowledgement");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <FullPageLoader label="Loading Student Dashboard..." />;

  // MERIT_GENERATED removed from valid acknowledgement statuses
  const showAcknowledgementStatuses = [
    "SUBMITTED", 
    "VERIFIED", 
    "PHYSICAL_VERIFICATION_PENDING", 
    "DOCUMENTS_VERIFIED", 
    "SEAT_ALLOTTED", 
    "SEAT_ACCEPTED", 
    "ADMITTED"
  ];

  const getStatusStyles = (status) => {
    if (["DOCUMENTS_VERIFIED", "ADMITTED", "SEAT_ACCEPTED"].includes(status)) {
      return "text-emerald-700 bg-emerald-100/80 border-emerald-200/50";
    }
    if (status === "REJECTED" || status === "CORRECTION_REQUIRED") {
      return "text-red-700 bg-red-100/80 border-red-200/50";
    }
    if (status === "PHYSICAL_VERIFICATION_PENDING") {
      return "text-amber-700 bg-amber-100/80 border-amber-200/50";
    }
    return "text-indigo-700 bg-indigo-100/80 border-indigo-200/50";
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-5xl mx-auto p-6 space-y-8"
    >
      {/* NO APPLICATION */}
      {!application && (
        <div className="bg-white/80 backdrop-blur-md p-10 text-center rounded-2xl shadow-lg border border-gray-100/50">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Student Admission Portal
          </h1>
          {(admission?.normalActive || admission?.lateralActive) ? (
            <Link to="/student/application" className="mt-8 inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
              Apply Now
            </Link>
          ) : (
            <p className="mt-6 text-red-500 font-bold bg-red-50 inline-block px-6 py-3 rounded-xl border border-red-100">Admissions Closed</p>
          )}
        </div>
      )}

      {/* DASHBOARD */}
      {application && (
        <div className="space-y-6">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow duration-300">
            <div>
              <h2 className="text-2xl font-extrabold flex items-center gap-3 bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent">
                <LayoutDashboard className="text-indigo-600" size={28} /> 
                Overview Dashboard
              </h2>
            </div>
            <Link to="/student/application" className="text-indigo-600 font-semibold hover:text-purple-700 flex items-center gap-2 bg-indigo-50 px-5 py-2.5 rounded-xl hover:bg-indigo-100 transition-colors duration-200">
              <FileText size={18} /> View Application Form <ArrowRight size={16} />
            </Link>
          </div>

          {/* PROGRESS TIMELINE UI */}
          <div className="bg-white/80 backdrop-blur-lg p-6 rounded-2xl shadow-sm border border-gray-100 hidden md:block">
            <div className="flex justify-between items-center relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full"></div>
              {getProgressSteps(application.status).map((step, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 relative bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300
                    ${step.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 
                      step.current ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200' : 
                      'bg-gray-100 border-gray-300 text-gray-400'}`}
                  >
                    {step.completed ? <Check size={16} strokeWidth={3} /> : idx + 1}
                  </div>
                  <span className={`text-xs font-bold tracking-wide ${step.current ? 'text-indigo-700' : step.completed ? 'text-emerald-700' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CORRECTION REQUIRED ALERT */}
          {application.status === "CORRECTION_REQUIRED" && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-r from-red-50 to-rose-50 p-6 rounded-2xl shadow-md border border-red-200 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4 text-red-800">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertTriangle className="text-red-600" size={28} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Action Required!</h3>
                  <p className="text-sm text-red-700 mt-1">Your application requires correction. Please review and resubmit.</p>
                </div>
              </div>
              <Link 
                to="/student/application" 
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-200 whitespace-nowrap flex items-center gap-2"
              >
                Go to Application & Resubmit <ArrowRight size={18} />
              </Link>
            </motion.div>
          )}

          {/* Application Details & Status */}
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8 hover:shadow-md transition-shadow duration-300">
            
            {/* Left Col: Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <Info size={18} className="text-indigo-500" />
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Application Information</p>
              </div>
              
              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium mb-1">Application ID</span>
                  <span className="font-bold text-gray-800 text-lg font-mono">
                    {application.applicationId || application._id.slice(-8).toUpperCase()}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 font-medium mb-1">Admission Type</span>
                  <span className="font-semibold text-gray-700">
                    {application.admissionType || "Regular"}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Col: Status & Merit */}
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={18} className="text-indigo-500" />
                <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">Current Status</p>
              </div>

              <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100/50 space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Application State</span>
                    <div className={`px-4 py-1.5 rounded-lg inline-flex w-fit font-bold border shadow-sm ${getStatusStyles(application.status)}`}>
                      {
                        {
                          PHYSICAL_VERIFICATION_PENDING: "Rank Generated - Visit College",
                          DOCUMENTS_VERIFIED: "Verification Completed",
                          SEAT_ALLOTTED: "Seat Allotted",
                          SEAT_ACCEPTED: "Seat Accepted"
                        }[application.status] || application.status.replace(/_/g, " ")
                      }
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 items-start md:items-end">
                    <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">Rank & Score</span>
                    {(application.meritScore || application.meritRank) ? (
                      <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800 px-4 py-1.5 rounded-lg font-extrabold border border-purple-200 shadow-sm">
                        <Award size={16} className="text-purple-600" />
                        {application.meritRank && <span>Rank: {application.meritRank}</span>}
                        {application.meritRank && application.meritScore && <span className="mx-1 opacity-50">|</span>}
                        {application.meritScore && <span>Score: {application.meritScore}</span>}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 italic bg-gray-100/80 px-3 py-1.5 rounded-lg border border-gray-200">
                        Rank not generated yet
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-700 flex items-start gap-2 font-medium">
                    <span className="mt-0.5 text-indigo-500"><Info size={16} /></span>
                    {nextStepMessage(application.status)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seat Allotment Actions */}
          {application.status === "SEAT_ALLOTTED" && seat && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 p-8 rounded-2xl border border-purple-200 shadow-lg"
            >
              <div className="flex items-center gap-3 mb-2">
                <Award className="text-purple-600" size={24} />
                <p className="font-extrabold text-purple-900 text-xl">Action Required: Seat Allotment</p>
              </div>
              <p className="text-purple-800 mt-2 text-lg">
                Congratulations! You have been allotted a seat in: <span className="font-bold bg-white/60 px-2 py-1 rounded-md">{seat.branch}</span>
              </p>
              <div className="flex flex-wrap gap-4 mt-6">
                <button 
                  onClick={() => respondSeat("ACCEPT")} 
                  disabled={actionLoading} 
                  className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:transform-none flex items-center gap-2"
                >
                  {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                  Accept Seat
                </button>
                <button 
                  onClick={() => respondSeat("REJECT")} 
                  disabled={actionLoading} 
                  className="bg-white border-2 border-red-500 text-red-600 hover:bg-red-50 px-8 py-3 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:transform-none flex items-center gap-2"
                >
                  Reject Seat
                </button>
              </div>
            </motion.div>
          )}

          {/* Actions & PDF Downloads */}
          <div className="bg-white/80 backdrop-blur-lg p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 hover:shadow-md transition-shadow duration-300">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="text-indigo-500" size={20} />
                Available Documents
              </h3>
              <p className="text-sm text-gray-500 font-medium">Download your official system-generated files below.</p>
            </div>

            <div className="flex flex-wrap gap-4 w-full lg:w-auto">
              {showAcknowledgementStatuses.includes(application.status) && (
                <button 
                  onClick={downloadAcknowledgementPDF} 
                  disabled={pdfLoading}
                  className="w-full lg:w-auto bg-gray-900 hover:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {pdfLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating PDF...</>
                  ) : (
                    <><Download size={18} /> Acknowledgement</>
                  )}
                </button>
              )}

              {application.status === "ADMITTED" && (
                <button 
                  onClick={downloadAdmissionPDF} 
                  disabled={pdfLoading}
                  className="w-full lg:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium flex justify-center items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                  {pdfLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating PDF...</>
                  ) : (
                    <><Download size={18} /> Admission Order</>
                  )}
                </button>
              )}
            </div>
          </div>

        </div>
      )}
    </motion.div>
  );
}

/* HELPERS */
function nextStepMessage(s) {
  return {
    "DRAFT": "Complete your application form.",
    "SUBMITTED": "Your application is submitted and under review.",
    "CORRECTION_REQUIRED": "Please correct and resubmit your application.",
    "VERIFIED": "Application verified. Preparing merit rank.",
    "PHYSICAL_VERIFICATION_PENDING": "Your rank is generated. Visit college for physical document verification.",
    "DOCUMENTS_VERIFIED": "Documents verified successfully. Wait for seat allotment.",
    "SEAT_ALLOTTED": "Seat allotted. Accept or reject your seat.",
    "SEAT_ACCEPTED": "Seat accepted. Admission process will complete soon.",
    "ADMITTED": "Congratulations! Admission completed.",
    "REJECTED": "Application rejected."
  }[s] || "Application is currently processing.";
}

function getProgressSteps(currentStatus) {
  const stepsDef = [
    { id: "SUBMITTED", label: "Submitted" },
    { id: "VERIFIED", label: "Verified" },
    { id: "PHYSICAL_VERIFICATION_PENDING", label: "Rank" },
    { id: "DOCUMENTS_VERIFIED", label: "Verification" },
    { id: "SEAT_ALLOTTED", label: "Seat" }, // Merged SEAT_ACCEPTED logically here for UI
    { id: "ADMITTED", label: "Admission" }
  ];

  const statusMap = {
    "DRAFT": -1,
    "SUBMITTED": 0,
    "CORRECTION_REQUIRED": 0,
    "VERIFIED": 1,
    "PHYSICAL_VERIFICATION_PENDING": 2,
    "DOCUMENTS_VERIFIED": 3,
    "SEAT_ALLOTTED": 4,
    "SEAT_ACCEPTED": 4, 
    "ADMITTED": 5,
    "REJECTED": -1
  };

  const currentIndex = statusMap[currentStatus] ?? -1;

  return stepsDef.map((step, index) => ({
    ...step,
    completed: index < currentIndex || (index === 5 && currentStatus === "ADMITTED"),
    current: index === currentIndex
  }));
}