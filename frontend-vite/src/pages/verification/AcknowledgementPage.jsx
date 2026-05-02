import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Download, CheckCircle, XCircle, RefreshCcw, 
  FileText, Hash, Printer, EyeOff, Eye 
} from "lucide-react";

// ==========================================
// 🎨 UI COMPONENTS 
// ==========================================

const SearchBox = ({ sslc, setSslc, onSearch, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="w-full flex flex-col gap-5 max-w-md mx-auto"
  >
    <div className="text-center space-y-1 mb-2">
      <h2 className="text-xl font-bold text-slate-800">Verify Applicant</h2>
      <p className="text-slate-500 text-sm">
        Enter your SSLC number to retrieve your application acknowledgement.
      </p>
    </div>

    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="w-5 h-5 text-slate-400" />
      </div>
      <input
        type="text"
        id="sslcInput"
        value={sslc}
        onChange={(e) => setSslc(e.target.value)}
        placeholder="Enter SSLC Number"
        className="block w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        onKeyDown={(e) => e.key === "Enter" && !loading && sslc && onSearch()}
      />
    </div>

    <button
      onClick={onSearch}
      disabled={!sslc || loading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2"
    >
      <Search className="w-5 h-5" /> Search Application
    </button>
  </motion.div>
);

const Loader = () => {
  return (
    <motion.div
      key="loader"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full flex flex-col items-center justify-center py-10 space-y-6"
    >
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute inset-0 border-t-4 border-blue-600 border-solid rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-r-4 border-slate-300 border-solid rounded-full animate-[spin_1.5s_reverse_infinite]"></div>
        <Search className="w-6 h-6 text-blue-600 animate-pulse" />
      </div>

      <div className="w-full space-y-2 text-center">
        <p className="text-blue-900 font-bold tracking-wide text-lg">Fetching Application...</p>
        <p className="text-sm text-slate-500 animate-pulse">
          Please wait while we verify your data in the system
        </p>
      </div>
    </motion.div>
  );
};

const ResultCard = ({ data, onDownload, downloading }) => (
  <motion.div
    key="result"
    initial={{ opacity: 0, scale: 0.95, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 200, damping: 20 }}
    className="w-full flex flex-col items-center text-center space-y-6 max-w-md mx-auto"
  >
    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center border border-green-200 shadow-sm">
      <svg className="w-10 h-10 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          d="M20 6L9 17l-5-5"
        />
      </svg>
    </div>

    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">
        {data?.basicDetails?.name || "Student Name"}
      </h2>
      <p className="text-green-600 font-bold text-sm flex items-center justify-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-200 inline-flex">
        <CheckCircle className="w-4 h-4" /> Match Found Successfully
      </p>
    </div>

    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-left shadow-inner">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-500 font-medium"><Hash className="w-4 h-4" /> App Number</div>
        <div className="font-bold text-slate-800">{data?.applicationNumber}</div>
      </div>
      <div className="h-[1px] w-full bg-slate-200"></div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-500 font-medium"><FileText className="w-4 h-4" /> SSLC Number</div>
        <div className="font-bold text-slate-800">{data?.educationalParticulars?.sslcRegisterNumber}</div>
      </div>
    </div>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onDownload}
      disabled={downloading}
      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
    >
      {downloading ? (
        <RefreshCcw className="w-5 h-5 animate-spin" />
      ) : (
        <Download className="w-5 h-5" />
      )}
      {downloading ? "Generating PDF..." : "Download Acknowledgement"}
    </motion.button>
  </motion.div>
);

const ErrorState = ({ message, onRetry }) => (
  <motion.div
    key="error"
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: [0, -5, 5, -5, 5, 0], transition: { duration: 0.4 } }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="w-full flex flex-col items-center text-center space-y-5 py-6 max-w-md mx-auto"
  >
    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-200 shadow-sm">
      <XCircle className="w-10 h-10 text-red-500" />
    </div>
    <div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">No Application Found</h2>
      <p className="text-slate-500 text-sm max-w-xs mx-auto">
        We couldn't find an application matching this SSLC number. Please check the number and try again.
      </p>
    </div>
    <button
      onClick={onRetry}
      className="w-full bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all mt-2"
    >
      <RefreshCcw className="w-4 h-4" /> Try Again
    </button>
  </motion.div>
);


// ==========================================
// 🚀 MAIN COMPONENT
// ==========================================

export default function AcknowledgementPage() {
  const [sslc, setSslc] = useState("");
  const [data, setData] = useState(null);
  const [uiState, setUiState] = useState("idle"); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  
  const previewRef = useRef(null);

  // Smooth scroll to preview after success
  useEffect(() => {
    if (uiState === "success" && data) {
      setTimeout(() => {
        previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 500); 
    }
  }, [uiState, data]);

  // ----------------------------------------
  // ORIGINAL BACKEND / PDF LOGIC
  // ----------------------------------------
  const waitForImages = async () => {
    const images = document.querySelectorAll("img");
    const promises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    return Promise.all(promises);
  };

  const downloadPDF = async () => {
    // If preview is hidden, temporarily show it so html2pdf can capture it
    const wasHidden = !showPreview;
    if (wasHidden) setShowPreview(true);
    
    setDownloading(true);
    try {
      const element = document.querySelector("#pdf-content");
      const studentName = data?.basicDetails?.name || "Student";
      const sslcNo = data?.educationalParticulars?.sslcRegisterNumber || "SSLC";
      const filename = `${studentName.replace(/\s+/g, "_")}_${sslcNo}.pdf`;

      await waitForImages();

      const opt = {
        margin: [0, 0, 0, 0],
        filename: filename,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 3, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await html2pdf().set(opt).from(element).save();
    } finally {
      setDownloading(false);
      if (wasHidden) setShowPreview(false);
    }
  };

  const search = async () => {
    if (!sslc) return;
    setUiState("loading");
    setErrorMsg("");
    setShowPreview(true); // Always open preview on new search
    
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/applications/search?sslc=${sslc}`
      );
      setData(res.data);
      setTimeout(() => setUiState("success"), 600); 
    } catch (err) {
      setErrorMsg("Application not found");
      setData(null);
      setUiState("error");
    }
  };

  const resetState = () => {
    setSslc("");
    setData(null);
    setUiState("idle");
  };

  const calculatePercentage = (obtained, max) => {
    if (!obtained || !max) return "0.000";
    return ((Number(obtained) / Number(max)) * 100).toFixed(3);
  };

  const getSpecialCategories = (specialCategoryObj) => {
    if (!specialCategoryObj) return "";
    const active = Object.keys(specialCategoryObj).filter((key) => specialCategoryObj[key] === true);
    return active.join(", ");
  };

  const formatMarks = (val) => val !== undefined && val !== null ? `${Number(val).toFixed(3)}` : "0.000";

  const formatDOB = (dobString) => {
    if (!dobString) return "";
    const date = new Date(dobString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const shouldShowDeclaration =
    !data?.categoryDetails?.hasCertificate ||
    data.categoryDetails.hasCertificate.trim().toUpperCase() === "NO" ||
    !!data.categoryDetails?.acknowledgementNumber;

  // ----------------------------------------
  // RENDER UI
  // ----------------------------------------
  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 font-sans">
      
      {/* Search Container */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200 print-hidden">
        
        {/* HEADER - Matching Application Form exactly */}
        <div className="bg-blue-900 p-6 text-white border-b-4 border-yellow-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-2xl shadow-lg shrink-0">
              K
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tight">Acknowledgement Download</h1>
              <p className="text-blue-200 text-sm md:text-base">Search your application</p>
            </div>
          </div>
        </div>

        {/* Dynamic State Body */}
        <div className="p-6 md:p-10 bg-white">
          <AnimatePresence mode="wait">
            {uiState === "idle" && <SearchBox key="idle" sslc={sslc} setSslc={setSslc} onSearch={search} loading={false} />}
            {uiState === "loading" && <Loader key="loading" />}
            {uiState === "success" && <ResultCard key="success" data={data} onDownload={downloadPDF} downloading={downloading} />}
            {uiState === "error" && <ErrorState key="error" message={errorMsg} onRetry={resetState} />}
          </AnimatePresence>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 📄 PDF PREVIEW SECTION (Visible on screen, structured for html2pdf) */}
      {/* ============================================================== */}
      {data && uiState === "success" && (
        <div ref={previewRef} className="max-w-6xl mx-auto mt-8 bg-white shadow-xl rounded-xl border border-slate-200 overflow-hidden print-container">
          
          {/* Action Bar */}
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-4 print-hidden">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Acknowledgement Preview
            </h2>
            <div className="flex gap-3">
            
              <button 
                onClick={() => setShowPreview(!showPreview)} 
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                {showPreview ? <><EyeOff className="w-4 h-4"/> Hide</> : <><Eye className="w-4 h-4"/> Show</>}
              </button>
            </div>
          </div>

          {/* Scrollable Document Wrapper */}
          <div className={`transition-all duration-300 ${showPreview ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
            <div className="p-4 sm:p-8 bg-slate-200/60 overflow-x-auto flex justify-center max-h-[800px] overflow-y-auto custom-scrollbar">
              
              <style>
                {`
                  @media print {
                    body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .print-hidden { display: none !important; }
                    .print-container { box-shadow: none !important; border: none !important; margin: 0 !important; max-width: none !important; }
                    .a4-container { margin: 0 !important; border: none !important; box-shadow: none !important; width: 210mm !important; height: 297mm !important; overflow: hidden; }
                  }
                    .tight-columns {
  gap: 4px !important;
}
  .ultra-tight {
  gap: 15px !important;              /* almost no gap */
}

.ultra-tight .field-item {
  flex: 0 0 auto !important;        /* stop stretching */
  min-width: 0;
}

.ultra-tight .field-label {
  white-space: nowrap;
}

.ultra-tight .field-value {
  margin-left: 2px;                 /* reduce label-value gap */
}
                  .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
                  .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                  .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
                  
                  .pdf-body { -webkit-print-color-adjust: exact; print-color-adjust: exact; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }
                  #pdf-content { display: block; background: white; }
                  .a4-container { page-break-after: always; break-after: page; width: 210mm; height: 297mm; margin: 0 auto; background: white; box-sizing: border-box; font-family: Arial, sans-serif; padding: 10mm 15mm; color: black; position: relative; overflow: visible; page-break-inside: avoid; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); margin-bottom: 2rem; }
                  .a4-container:last-child { page-break-after: avoid; break-after: avoid; margin-bottom: 0; }
                  .header-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 10px; }
                  .govt-logo { width: 50px; height: 50px; object-fit: contain; margin-bottom: 5px; }
                  .header-main-flex { display: flex; align-items: center; justify-content: space-between; width: 100%; }
                  .college-logo { width: 85px; height: 85px; object-fit: contain; }
                  .header-center-text { text-align: center; flex: 1; }
                  .field-row { display: flex; gap: 12px; margin-bottom: 6px; width: 100%; align-items: baseline; }
                  .field-item { display: flex; white-space: nowrap; align-items: baseline; flex-shrink: 0; }
                  .field-label { font-size: 11px; font-weight: normal; color: #000; }
                  .field-value { font-size: 11px; font-weight: bold; color: #000; margin-left: 4px; text-transform: uppercase; }
                  .flex-1 { flex: 1; } .border-black { border: 1px solid black; } .text-center { text-align: center; } .font-bold { font-weight: bold; }
                  .ht-official-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
                  .ht-official-table th, .ht-official-table td { border: 1px solid black; padding: 8px; text-align: left; }
                  .ht-yellow-header { background-color: #fef08a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .signature-box { border-left: 1px solid black; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding-bottom: 10px; }
                `}
              </style>
              
              <div id="pdf-content" className="pdf-body shrink-0 origin-top">
                {/* ================= PAGE 1: ACKNOWLEDGEMENT ================= */}
                <div className="a4-container">
                  <div className="header-wrapper">
                    <img src="/Seal_of_Karnataka.png" alt="Govt Logo" className="govt-logo" />
                    <div className="header-main-flex">
                      <img src="https://www.kptplacements.org/logo.jpg" alt="College Logo" className="college-logo" />
                      <div className="header-center-text">
                        <p style={{ fontSize: '12px' }}>GOVERNMENT OF KARNATAKA</p>
                        <p style={{ fontSize: '13px' }} className="font-bold">DEPARTMENT OF TECHNICAL EDUCATION</p>
                        <p style={{ fontSize: '15px' }} className="font-bold mt-1">KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE</p>
                        <p style={{ fontSize: '10px' }} className="font-normal italic">(An Autonomous Institution Under AICTE, New Delhi)</p>
                      </div>
                      <img src="https://www.kptplacements.org/logo2.png" alt="75 Years Logo" className="college-logo" />
                    </div>
                  </div>

                  <div className="text-center mb-4 py-1" style={{ borderTop: '1.5px solid black', borderBottom: '1.5px solid black' }}>
                    <p style={{ fontSize: '10px' }} className="font-bold uppercase">
                      APPLICATION FORM FOR ONLINE ADMISSION TO FIRST YEAR DIPLOMA COURSES FOR THE YEAR 2026-27
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
                    <div className="flex-1">
                      <div className="field-row">
                        <div className="field-item flex-1">
                          <span className="field-label">1. SATS No:</span>
                          <span className="field-value">{data.basicDetails?.satsNumber || "0000000000"}</span>
                        </div>
                        <div className="field-item flex-1">
                          <span className="field-label">2. SSLC OR EQUIVALENT REG NO:</span>
                          <span className="field-value">{data.educationalParticulars?.sslcRegisterNumber}</span>
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-item flex-1">
                          <span className="field-label">3. Aadhaar Number:</span>
                          <span className="field-value">{data.basicDetails?.aadharNumber || "-"}</span>
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-item flex-1">
                          <span className="field-label">4. Name of the Candidate:</span>
                          <span className="field-value">{data.basicDetails?.name}</span>
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-item flex-1">
                          <span className="field-label">5. Date of Birth:</span>
                          <span className="field-value">{formatDOB(data.basicDetails?.dob)}</span>
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-item flex-1">
                          <span className="field-label">6. Father Name:</span>
                          <span className="field-value">{data.basicDetails?.fatherName}</span>
                        </div>
                      </div>
                      <div className="field-row">
                        <div className="field-item flex-1">
                          <span className="field-label">7. Mother Name:</span>
                          <span className="field-value">{data.basicDetails?.motherName}</span>
                        </div>
                        <div className="field-item flex-1">
                          <span className="field-label">8. Gender:</span>
                          <span className="field-value">{data.basicDetails?.gender}</span>
                        </div>
                      </div>

                      <div style={{ margin: '8px 0' }}>
                        <span className="field-label font-bold">9. Contact Details</span>
                        <div className="field-row" style={{ marginTop: '4px' }}>
                          <div className="field-item">
                            <span className="field-label">a) Mobile:</span>
                            <span className="field-value">{data.contactDetails?.mobile}</span>
                          </div>
                          <div className="field-item">
                            <span className="field-label">b) E-mail:</span>
                            <span className="field-value" style={{ textTransform: 'none' }}>{data.contactDetails?.email}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ width: '135px', flexShrink: 0 }}>
                      <div className="border-black mb-2 p-2 text-center">
                        <p style={{ fontSize: '9px' }} className="font-bold uppercase">Registration NO.</p>
                        <p style={{ fontSize: '14px' }} className="font-extrabold ">{data.applicationNumber}</p>
                      </div>
                      <div className="border-black" style={{ height: '145px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfcfc' }}>
                        <p style={{ fontSize: '9px' }} className="font-bold text-center px-2">RECENT PASSPORT SIZE COLOR PHOTO</p>
                      </div>
                    </div>
                  </div>

                  <div className="field-row ultra-tight">
                    <div className="field-item flex-1">
                      <span className="field-label">10. Indian Nationality:</span>
                      <span className="field-value">{(data.basicDetails?.nationality || "").toUpperCase()}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">11. Religion:</span>
                      <span className="field-value">{data.basicDetails?.religion}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">12. Year of Passing:</span>
                      <span className="field-value">{data.educationalParticulars?.sslcPassingYear}</span>
                    </div>
                  </div>
                  <div className="field-row ultra-tight">
                    <div className="field-item flex-1">
                      <span className="field-label">13. Qualifying Exam Name :</span>
                      <span className="field-value">{data.qualifyingDetails?.qualifyingExam}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">14. Native State :</span>
                      <span className="field-value">{data.contactDetails?.state || "-"}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">15. Native District :</span>
                      <span className="field-value">{data.contactDetails?.district || "-"}</span>
                    </div>
                  </div>
                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">16. SSLC/Q.E State:</span>
                      <span className="field-value">{data.qualifyingDetails?.nativeState || "-"}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">17. SSLC/Q.E District:</span>
                      <span className="field-value">{data.qualifyingDetails?.nativeDistrict || "-"}</span>
                    </div>
                  </div>
                  
                  <div className="field-row" style={{ marginTop: '5px' }}>
                    <div className="field-item flex-1">
                      <span className="field-label">18. Yrs Studied in KA:</span>
                      <span className="field-value">{data.studyEligibility?.yearsStudiedInKarnataka}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">19. Max Marks:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.sslcMaxMarks)}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">20. Obt Marks:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.sslcObtainedMarks)}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">21. %:</span>
                      <span className="field-value">{calculatePercentage(data.educationalParticulars?.sslcObtainedMarks, data.educationalParticulars?.sslcMaxMarks)}</span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">22. Marks in Maths:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.obtainedMathsMarks)}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">23. Max Marks in Maths:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.maxMathsMarks)}</span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">24. Marks in Science:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.obtainedScienceMarks)}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">25. Max Marks in Science:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.maxScienceMarks)}</span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">26. Total Max Marks in Science & Maths:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.totalMaxScienceMaths)}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">27. Total Marks Obtained in Science & Maths:</span>
                      <span className="field-value">{formatMarks(data.educationalParticulars?.totalObtainedScienceMaths)}</span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">28. 5yr Exemption Rule:</span>
                      <span className="field-value">{(data.exemptionClaims?.isFiveYearExemption || "").toUpperCase()}</span>
                    </div>
                    {(data.exemptionClaims?.isFiveYearExemption || "").toUpperCase() === "YES" && (
                      <div className="field-item flex-1">
                        <span className="field-label">Clause:</span>
                        <span className="field-value">{data.exemptionClaims?.exemptionClause || "-"}</span>
                      </div>
                    )}
                    <div className="field-item flex-1">
                      <span className="field-label">29. Rural (1-10th):</span>
                      <span className="field-value">{data.studyEligibility?.isRural?.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">30. Kan. Medium (1-10th):</span>
                      <span className="field-value">{data.studyEligibility?.isKannadaMedium?.toUpperCase()}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">31. SNQ:</span>
                      <span className="field-value">{(data.exemptionClaims?.isSNQ || "").toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">32. Category:</span>
                      <span className="field-value">{data.categoryDetails?.category}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">33. Caste:</span>
                      <span className="field-value">{data.categoryDetails?.casteName || "-"}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">34. Income:</span>
                      <span className="field-value">{data.categoryDetails?.annualIncome}</span>
                    </div>
                  </div>
                  
                  {(data.shiftDetails?.shiftType || "").toUpperCase().includes("EVENING") && (
                    <div className="field-row">
                      <div className="field-item flex-1">
                        <span className="field-label">35. Shift:</span>
                        <span className="field-value">EVENING</span>
                      </div>
                      <div className="field-item flex-1">
                        <span className="field-label">36. Experience:</span>
                        <span className="field-value">
                          {data.shiftDetails?.experienceYears || 0}Y {data.shiftDetails?.experienceMonths || 0}M
                        </span>
                      </div>
                      <div className="field-item flex-1">
                        <span className="field-label">37. Service Certificate:</span>
                        <span className="field-value">
                          {(data.shiftDetails?.serviceCertificate || "").toUpperCase() === "YES" ? "PROVIDED" : "NOT PROVIDED"}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="field-row">
                    <div className="field-item flex-1">
                      <span className="field-label">38. HK Claim:</span>
                      <span className="field-value">{data.exemptionClaims?.isHyderabadKarnataka?.toUpperCase()}</span>
                    </div>
                    <div className="field-item flex-1">
                      <span className="field-label">39. * Special Category:</span>
                      <span className="field-value">{getSpecialCategories(data.specialCategory) || "NONE"}</span>
                    </div>
                  </div>

                  <div className="border-black p-2 mt-3">
                    <p className="field-label font-bold mb-1">40. Residential Address</p>
                    <p className="field-value" style={{ marginLeft: 0, lineHeight: '1.4' }}>{data.contactDetails?.address}</p>
                    <div className="field-item mt-2">
                      <span className="field-label">Pincode:</span>
                      <span className="field-value">{data.contactDetails?.pincode}</span>
                    </div>
                  </div>

                  {shouldShowDeclaration && (
                    <div style={{ marginTop: '10px', marginBottom: '6px' }}>
                      <p style={{ fontSize: '10px', lineHeight: '1.4' }} className="font-black text-center uppercase">
                        I AGREE TO PRODUCE ORIGINAL CASTE/INCOME CERTIFICATE AT THE TIME OF 1ST ROUND COUNSELLING OTHERWISE SEAT WILL BE ALLOTTED ONLY UNDER GENERAL MERIT QUOTA.
                      </p>
                    </div>
                  )}

                  <div className="text-center pt-2" style={{ borderTop: '1px solid black' }}>
                    <p className="font-bold uppercase" style={{ fontSize: '13px' }}>Declaration</p>
                    <p style={{ fontSize: '10px', marginTop: '6px', lineHeight: '1.5' }}>
                      I/We declare that the above information is true and correct to the best of our knowledge. If annual income is not provided, it will be assumed to be more than 8 lakhs. I agree to produce all original certificates during verification.
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '45px', padding: '0 10px' }}>
                    <div className="text-center" style={{ width: '180px' }}>
                      <div style={{ borderTop: '1px solid black', paddingTop: '5px' }}>
                        <p className="font-bold uppercase" style={{ fontSize: '10px' }}>Signature of Dean / Nodal Officer</p>
                      </div>
                    </div>
                    <div className="text-center" style={{ width: '180px' }}>
                      <p className="font-bold uppercase" style={{ fontSize: '11px', marginBottom: '4px' }}>({data.basicDetails?.fatherName || ""})</p>
                      <div style={{ borderTop: '1px solid black', paddingTop: '5px' }}>
                        <p className="font-bold uppercase" style={{ fontSize: '10px' }}>Parent/Guardian Signature</p>
                      </div>
                    </div>
                    <div className="text-center" style={{ width: '180px' }}>
                      <p className="font-bold uppercase" style={{ fontSize: '11px', marginBottom: '4px' }}>({data.basicDetails?.name || ""})</p>
                      <div style={{ borderTop: '1px solid black', paddingTop: '5px' }}>
                        <p className="font-bold uppercase" style={{ fontSize: '10px' }}>Candidate Signature</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ position: 'absolute', bottom: '10mm', left: '15mm', right: '15mm' }}>
                    <div style={{ borderTop: '1.5px solid black', paddingTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', fontSize: '10px' }}>
                        <p><span className="font-bold uppercase">Registration Center:</span> KARNATAKA (GOVT) POLYTECHNIC, MANGALORE</p>
                      </div>
                      <div className="mt-2 text-center" style={{ fontSize: '9px' }}>
                        <p className="font-bold">NOTE: * Special category claims are subject to document verification.</p>
                        <p className="font-bold uppercase mt-1">No further changes will be entertained after application submission.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= PAGE 2: HALL TICKET / ADMISSION TICKET ================= */}
                <div className="a4-container">
                  <div className="header-wrapper">
                    <img src="/Seal_of_Karnataka.png" alt="Govt Logo" style={{ width: "60px", height: "60px", objectFit: "contain", marginBottom: "5px" }} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <img src="https://www.kptplacements.org/logo.jpg" alt="College Logo" style={{ width: "85px", height: "85px", objectFit: "contain" }} />
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <p style={{ fontSize: "11px" }}>GOVERNMENT OF KARNATAKA</p>
                        <p style={{ fontSize: "12px" }} className="font-bold">DEPARTMENT OF TECHNICAL EDUCATION</p>
                        <p style={{ fontSize: "14px" }} className="font-bold mt-1">KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU</p>
                        <p style={{ fontSize: "9px" }} className="italic">(An Autonomous Institution under AICTE, New Delhi)</p>
                        <p className="font-bold mt-1" style={{ fontSize: "13px" }}>KPT COMMON ADMISSION TEST (KPT-CAT) 2026-27</p>
                        <p className="font-bold uppercase" style={{ fontSize: "14px", marginTop: "4px" }}>HALL TICKET / ADMISSION TICKET</p>
                      </div>
                      <img src="https://www.kptplacements.org/logo2.png" alt="75 Years Logo" style={{ width: "85px", height: "85px", objectFit: "contain" }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: "8px" }}></div>

                  <table className="ht-official-table">
                    <thead>
                      <tr className="ht-yellow-header">
                        <th className="font-bold w-1/3">Particulars</th>
                        <th className="font-bold">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-bold">Exam Name</td>
                        <td className="font-bold uppercase">KPT Common Admission Test (KPT-CAT) 2026-27</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Exam Date</td>
                        <td className="font-bold uppercase">{data.examDetails?.examDate || "30-04-2026"}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Reporting Time</td>
                        <td className="font-bold uppercase">9:00 AM (Sharp)</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Exam Time</td>
                        <td className="font-bold uppercase">10:00 AM to 11:00 AM (60 Minutes)</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Exam Centre</td>
                        <td className="font-bold uppercase">Karnataka (Govt.) Polytechnic, Kadri Hills, Mangaluru - 575004</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="font-bold text-center mb-1" style={{ fontSize: '12px' }}>Candidate Details</p>
                  
                  <table className="ht-official-table">
                    <thead>
                      <tr className="ht-yellow-header">
                        <th className="font-bold w-1/3">Particulars</th>
                        <th className="font-bold">Details</th>
                        <th className="font-bold text-center" style={{ width: '25%' }}>Invigilator's Signature</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-bold">Registration Number</td>
                        <td className="font-bold uppercase">{data.applicationNumber}</td>
                        <td className="align-bottom text-center pb-2" rowSpan="7">Signature:</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Aadhaar Number</td>
                        <td className="font-bold uppercase">{data.basicDetails?.aadharNumber || "Not Provided"}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Candidate's Name</td>
                        <td className="font-bold uppercase">{data.basicDetails?.name}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Father's Name</td>
                        <td className="font-bold uppercase">{data.basicDetails?.fatherName}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Mother's Name</td>
                        <td className="font-bold uppercase">{data.basicDetails?.motherName}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Date of Birth</td>
                        <td className="font-bold uppercase">{formatDOB(data.basicDetails?.dob)}</td>
                      </tr>
                      <tr>
                        <td className="font-bold">Gender</td>
                        <td className="font-bold uppercase">
                          {data.basicDetails?.gender === 'Male' ? '☑ Male / ☐ Female' : data.basicDetails?.gender === 'Female' ? '☐ Male / ☑ Female' : '☐ Male / ☐ Female'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ marginTop: "10px" }}>
                    <p className="font-bold underline mb-3" style={{ fontSize: '13px' }}>Instructions to Candidates:</p>
                    <ol className="list-decimal pl-5 text-justify" style={{ fontSize: '12px', lineHeight: '1.3' }}>
                      <li><strong>Mandatory Attendance:</strong> Candidates who have submitted the application must compulsorily write the KPT Common Admission Test (KPT-CAT). Admission eligibility will not be granted without appearing for the exam.</li>
                      <li><strong>Hall Ticket Mandatory:</strong> On the day of the KPT Common Admission Test, candidates must compulsorily produce this Hall Ticket / Admission Ticket. Entry to the exam centre will not be permitted without it.</li>
                      <li><strong>Writing Materials:</strong> Candidates must compulsorily bring a writing pad. Bring a black ballpoint pen to mark the answers.</li>
                      <li><strong>Schedule:</strong> Reporting time is 9:00 AM sharp. Candidates must report at the exam centre on time. Latecomers will not be permitted.</li>
                      <li><strong>Identity Proof:</strong> Must compulsorily bring the original Aadhaar Card / PAN Card / Voter ID / Driving Licence / SSLC Hall Ticket / PUC Hall Ticket / or any photo ID card.</li>
                      <li><strong>Prohibited Items:</strong> Mobile phones, smart watches, calculators, electronic gadgets, and study materials are strictly prohibited inside the exam hall.</li>
                    </ol>
                  </div>
                  
                  <div style={{ marginTop: "25px", display: "flex", justifyContent: "space-between", padding: "0 10px" }}>
                    <div style={{ width: "200px", textAlign: "center" }}>
                      <div style={{ borderTop: "1px solid black", marginBottom: "3px" }}></div>
                      <p style={{ fontSize: "10px", fontWeight: "bold" }}>Candidate's Signature</p>
                      <p style={{ fontSize: "8px" }}>(Sign in front of Invigilator)</p>
                    </div>
                    <div style={{ width: "200px", textAlign: "center" }}>
                      <div style={{ borderTop: "1px solid black", marginBottom: "3px" }}></div>
                      <p style={{ fontSize: "10px", fontWeight: "bold" }}>Dean (Academic) / Nodal Officer</p>
                      <p style={{ fontSize: "10px", fontWeight: "bold" }}>Signature</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}