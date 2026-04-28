import React, { useState } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

export default function AcknowledgementPage() {
  const [sslc, setSslc] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const element = document.querySelector("#printable-document");
    if (!element) return;

    const studentName = data?.basicDetails?.name || "Student";
    const sslcNo = data?.educationalParticulars?.sslcRegisterNumber || "SSLC";
    const filename = `${studentName.replace(/\s+/g, "_")}_${sslcNo}.pdf`;

    await waitForImages();

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 5, // High quality scale
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: ["css", "legacy"] },
    };

    // Correctly execute the PDF generation
    html2pdf().set(opt).from(element).save();
  };

  const search = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/applications/search?sslc=${sslc}`
      );
      setData(res.data);
    } catch (err) {
      setError("Application not found");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const calculatePercentage = (obtained, max) => {
    if (!obtained || !max) return "0.000";
    return ((Number(obtained) / Number(max)) * 100).toFixed(3);
  };

  const getSpecialCategories = (specialCategoryObj) => {
    if (!specialCategoryObj) return "";
    const active = Object.keys(specialCategoryObj).filter(
      (key) => specialCategoryObj[key] === true
    );
    return active.join(", ");
  };

  const formatMarks = (val) => {
    return val !== undefined && val !== null ? `${Number(val).toFixed(3)}` : "0.000";
  };

  const formatDOB = (dobString) => {
    if (!dobString) return "";
    const date = new Date(dobString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  return (
    <div className="bg-gray-200 min-h-screen py-8">
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hidden { display: none !important; }
          }
        
          .a4-container {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            margin: 0 auto;
            background: white;
            position: relative;
            box-sizing: border-box;
            page-break-after: always;
          }

          .a4-container:last-child {
            page-break-after: auto;
          }

          .header-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 10px; }
          .govt-logo { width: 50px; height: 50px; object-fit: contain; margin-bottom: 5px; }
          .header-main-flex { display: flex; align-items: center; justify-content: space-between; width: 100%; }
          .college-logo { width: 85px; height: 85px; object-fit: contain; }
          .header-center-text { text-align: center; flex: 1; }
          
          * {
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }

          .field-row { display: flex; gap: 12px; margin-bottom: 6px; width: 100%; align-items: baseline; }
          .field-item { display: flex; white-space: nowrap; align-items: baseline; flex-shrink: 0; }
          .field-label { font-size: 11px; font-weight: normal; color: #000; }
          .field-value { font-size: 11px; font-weight: bold; color: #000; margin-left: 4px; text-transform: uppercase; }
          
          .flex-1 { flex: 1; }
          .border-black { border: 1px solid black; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }

          .ht-official-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
          .ht-official-table th, .ht-official-table td { border: 1px solid black; padding: 8px; text-align: left; }
          .ht-yellow-header { background-color: #fef08a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        `}
      </style>

      {/* Search Bar Area */}
      <div className="max-w-2xl mx-auto mb-6 p-4 bg-white rounded shadow-md print-hidden flex gap-3">
        <input
          type="text"
          value={sslc}
          onChange={(e) => setSslc(e.target.value)}
          placeholder="Enter SSLC Number"
          className="flex-1 border p-2 rounded outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button onClick={search} className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
          {loading ? "Searching..." : "Search"}
        </button>
        {data && (
          <button
            onClick={downloadPDF}
            className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700"
          >
            Download PDF
          </button>
        )}
      </div>

      {error && <p className="text-red-500 text-center font-bold print-hidden mb-4">{error}</p>}

      {data && (
        <div id="printable-document">
          {/* ================= PAGE 1: ACKNOWLEDGEMENT ================= */}
          <div className="a4-container">
            <div className="header-wrapper">
              <img src="/Seal_of_Karnataka.png" alt="Govt Logo" className="govt-logo" />
              <div className="header-main-flex">
                <img src="https://www.kptplacements.org/logo.jpg" alt="College Logo" className="college-logo" />
                <div className="header-center-text">
                  <p style={{ fontSize: "12px" }}>GOVERNMENT OF KARNATAKA</p>
                  <p style={{ fontSize: "13px" }} className="font-bold">DEPARTMENT OF TECHNICAL EDUCATION</p>
                  <p style={{ fontSize: "15px" }} className="font-bold mt-1">KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE</p>
                  <p style={{ fontSize: "10px" }} className="font-normal italic">(An Autonomous Institution Under AICTE, New Delhi)</p>
                </div>
                <img src="https://www.kptplacements.org/logo2.png" alt="75 Years Logo" className="college-logo" />
              </div>
            </div>

            <div className="text-center mb-4 py-1" style={{ borderTop: "1.5px solid black", borderBottom: "1.5px solid black" }}>
              <p style={{ fontSize: "10px" }} className="font-bold uppercase">
                APPLICATION FORM FOR ONLINE ADMISSION TO FIRST YEAR DIPLOMA COURSES FOR THE YEAR 2026-27
              </p>
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "8px" }}>
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

                <div style={{ margin: "8px 0" }}>
                  <span className="field-label font-bold">9. Contact Details</span>
                  <div className="field-row" style={{ marginTop: "4px" }}>
                    <div className="field-item">
                      <span className="field-label">a) Mobile:</span>
                      <span className="field-value">{data.contactDetails?.mobile}</span>
                    </div>
                    <div className="field-item">
                      <span className="field-label">b) E-mail:</span>
                      <span className="field-value" style={{ textTransform: "none" }}>{data.contactDetails?.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ width: "135px", flexShrink: 0 }}>
                <div className="border-black mb-2 p-2 text-center">
                  <p style={{ fontSize: "9px" }} className="font-bold uppercase">Application No.</p>
                  <p style={{ fontSize: "14px" }} className="font-extrabold">{data.applicationNumber}</p>
                </div>
                <div className="border-black" style={{ height: "145px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fcfcfc" }}>
                  <p style={{ fontSize: "9px" }} className="font-bold text-center px-2">RECENT PASSPORT SIZE COLOR PHOTO</p>
                </div>
              </div>
            </div>

            <div className="field-row">
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

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">13. Qualifying Exam Code:</span>
                <span className="field-value">{data.qualifyingDetails?.qualifyingExam}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">14. Native State Code:</span>
                <span className="field-value">{data.qualifyingDetails?.nativeState}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">15. Native District Code:</span>
                <span className="field-value">{data.qualifyingDetails?.nativeDistrict}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">16. SSLC State Appearance:</span>
                <span className="field-value">{data.studyEligibility?.stateAppearedForQualifyingExam}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">17. SSLC District Appearance:</span>
                <span className="field-value">{data.contactDetails?.district}</span>
              </div>
            </div>

            <div className="field-row" style={{ marginTop: "5px" }}>
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
              <p className="field-value" style={{ marginLeft: 0, lineHeight: "1.4" }}>{data.contactDetails?.address}</p>
              <div className="field-item mt-2">
                <span className="field-label">Pincode:</span>
                <span className="field-value">{data.contactDetails?.pincode}</span>
              </div>
            </div>

            <div className="text-center pt-2 mt-4" style={{ borderTop: "1px solid black" }}>
              <p className="font-bold uppercase" style={{ fontSize: "13px" }}>Declaration</p>
              <p style={{ fontSize: "10px", marginTop: "6px", lineHeight: "1.5" }}>
                I/We declare that the above information is true and correct to the best of our knowledge. I agree to produce all original certificates during verification.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "45px", padding: "0 10px" }}>
              <div className="text-center" style={{ width: "180px" }}>
                <div style={{ borderTop: "1px solid black", paddingTop: "5px" }}>
                  <p className="font-bold uppercase" style={{ fontSize: "10px" }}>Dean / Nodal Officer</p>
                </div>
              </div>
              <div className="text-center" style={{ width: "180px" }}>
                <div style={{ borderTop: "1px solid black", paddingTop: "5px" }}>
                  <p className="font-bold uppercase" style={{ fontSize: "10px" }}>Parent/Guardian Signature</p>
                </div>
              </div>
              <div className="text-center" style={{ width: "180px" }}>
                <div style={{ borderTop: "1px solid black", paddingTop: "5px" }}>
                  <p className="font-bold uppercase" style={{ fontSize: "10px" }}>Candidate Signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* ================= PAGE 2: HALL TICKET ================= */}
          <div className="a4-container">
            <div className="text-center mb-6">
              <p className="font-bold" style={{ fontSize: "18px" }}>KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU</p>
              <p style={{ fontSize: "14px" }}>(An Autonomous Institution under AICTE, New Delhi)</p>
              <p className="font-bold mt-2" style={{ fontSize: "16px" }}>KPT COMMON ADMISSION TEST (KPT-CAT) 2026-27</p>
              <p className="font-bold underline mt-1 uppercase" style={{ fontSize: "16px" }}>HALL TICKET / ADMISSION TICKET</p>
            </div>

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

            <p className="font-bold underline text-center mb-2" style={{ fontSize: "14px" }}>Candidate Details</p>
            
            <table className="ht-official-table">
              <thead>
                <tr className="ht-yellow-header">
                  <th className="font-bold w-1/3">Particulars</th>
                  <th className="font-bold">Details</th>
                  <th className="font-bold text-center" style={{ width: "25%" }}>Invigilator's Signature</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-bold">Registration Number</td>
                  <td className="font-bold uppercase">{data.applicationNumber}</td>
                  <td className="align-bottom text-center pb-2" rowSpan="6">
                    Signature:
                  </td>
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
                  <td className="font-bold uppercase">{data.basicDetails?.gender}</td>
                </tr>
              </tbody>
            </table>

            <div className="mt-6">
              <p className="font-bold underline mb-3" style={{ fontSize: "13px" }}>Instructions to Candidates:</p>
              <ol className="list-decimal pl-5 space-y-2 text-justify" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                <li><strong>Mandatory Attendance:</strong> Candidates must compulsorily write the KPT-CAT.</li>
                <li><strong>Hall Ticket Mandatory:</strong> Entry to the exam centre will not be permitted without this ticket.</li>
                <li><strong>Writing Materials:</strong> Bring a writing pad and black/blue ballpoint pen.</li>
                <li><strong>Schedule:</strong> Reporting time is 9:00 AM sharp. Latecomers will not be permitted.</li>
                <li><strong>Identity Proof:</strong> Bring original Aadhaar Card or any valid Photo ID.</li>
              </ol>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "60px", padding: "0 20px" }}>
              <div className="text-center" style={{ width: "220px" }}>
                <div style={{ borderTop: "1px solid black", paddingTop: "5px" }}>
                  <p className="font-bold" style={{ fontSize: "12px" }}>Candidate's Signature</p>
                </div>
              </div>
              <div className="text-center" style={{ width: "220px" }}>
                <div style={{ borderTop: "1px solid black", paddingTop: "5px" }}>
                  <p className="font-bold" style={{ fontSize: "12px" }}>Dean / Nodal Officer Signature</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}