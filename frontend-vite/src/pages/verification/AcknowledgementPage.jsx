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
    // Changed selector to capture BOTH pages wrapped in the parent div
    const element = document.querySelector("#printable-document");

    const studentName = data?.basicDetails?.name || "Student";
    const sslcNo = data?.educationalParticulars?.sslcRegisterNumber || "SSLC";
    const filename = `${studentName.replace(/\s+/g, "_")}_${sslcNo}.pdf`;

    await waitForImages();

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 4,
        useCORS: true,
        allowTaint: false,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

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

  return (
    <div className="bg-gray-200 min-h-screen py-8">
      <style>
        {`
          @media print {
            body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-hidden { display: none !important; }
            .a4-container { margin: 0 !important; border: none !important; box-shadow: none !important; width: 210mm !important; height: 297mm !important; overflow: hidden; }
          }
          
          .a4-container {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            background: white;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            padding: 10mm 15mm;
            color: black;
            position: relative;
          }

          /* Hall Ticket Table Styles */
          .ht-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .ht-table th, .ht-table td { border: 1px solid black; padding: 10px; text-align: left; font-size: 12px; }
          .ht-table th { background-color: #f2f2f2; width: 35%; }

          /* Header Layout */
          .header-wrapper { display: flex; flex-direction: column; align-items: center; margin-bottom: 10px; }
          .govt-logo { width: 50px; height: 50px; object-fit: contain; margin-bottom: 5px; }
          .header-main-flex { display: flex; align-items: center; justify-content: space-between; width: 100%; }
          .college-logo { width: 85px; height: 85px; object-fit: contain; }
          .header-center-text { text-align: center; flex: 1; }

          /* Field Alignment */
          .field-row { display: flex; gap: 12px; margin-bottom: 6px; width: 100%; align-items: baseline; }
          .field-item { display: flex; white-space: nowrap; align-items: baseline; flex-shrink: 0; }
          .field-label { font-size: 11px; font-weight: normal; color: #000; }
          .field-value { font-size: 11px; font-weight: bold; color: #000; margin-left: 4px; text-transform: uppercase; }
          
          .flex-1 { flex: 1; }
          .border-black { border: 1px solid black; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
        `}
      </style>

      {/* Search Bar */}
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

      {error && <p className="text-red-500 text-center font-bold print-hidden">{error}</p>}

      {data && (
        <div id="printable-document">
          {/* PAGE 1: ACKNOWLEDGEMENT (UNCHANGED) */}
          <div className="a4-container">
            {/* Header Section */}
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

            {/* Form Title */}
            <div className="text-center mb-4 py-1" style={{ borderTop: '1.5px solid black', borderBottom: '1.5px solid black' }}>
              <p style={{ fontSize: '10px' }} className="font-bold uppercase">
                APPLICATION FORM FOR ONLINE ADMISSION TO FIRST YEAR DIPLOMA COURSES FOR THE YEAR 2026-27
              </p>
            </div>

            {/* Profile Section */}
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
                    <span className="field-label">3. Name of the Candidate:</span>
                    <span className="field-value">{data.basicDetails?.name}</span>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-item flex-1">
                    <span className="field-label">4. Date of Birth:</span>
                    <span className="field-value">
                      {data.basicDetails?.dob ? new Date(data.basicDetails.dob).toISOString().split('T')[0] : ""}
                    </span>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-item flex-1">
                    <span className="field-label">5. Father Name:</span>
                    <span className="field-value">{data.basicDetails?.fatherName}</span>
                  </div>
                </div>

                <div className="field-row">
                  <div className="field-item flex-1">
                    <span className="field-label">6. Mother Name:</span>
                    <span className="field-value">{data.basicDetails?.motherName}</span>
                  </div>
                  <div className="field-item flex-1">
                    <span className="field-label">7. Gender:</span>
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
                  <p style={{ fontSize: '9px' }} className="font-bold uppercase">Application No.</p>
                  <p style={{ fontSize: '14px' }} className="font-extrabold ">{data.applicationNumber}</p>
                </div>
                <div className="border-black" style={{ height: '145px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfcfc' }}>
                  <p style={{ fontSize: '9px' }} className="font-bold text-center px-2">RECENT PASSPORT SIZE COLOR PHOTO</p>
                </div>
              </div>
            </div>

            {/* Grid Rows */}
            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">10. Indian Nationality:</span>
                <span className="field-value">{data.basicDetails?.nationality === "Yes" ? "INDIAN" : "NO"}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">11. Religion:</span>
                <span className="field-value">{data.basicDetails?.religion}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">13. Year of Passing:</span>
                <span className="field-value">{data.educationalParticulars?.sslcPassingYear}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">14. Qualifying Exam Code:</span>
                <span className="field-value">{data.qualifyingDetails?.qualifyingExam}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">15. Native State Code:</span>
                <span className="field-value">{data.qualifyingDetails?.nativeState}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">16. Native District Code:</span>
                <span className="field-value">{data.qualifyingDetails?.nativeDistrict}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">17. SSLC State Appearance:</span>
                <span className="field-value">{data.studyEligibility?.stateAppearedForQualifyingExam}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">18. SSLC District Appearance:</span>
                <span className="field-value">{data.contactDetails?.district}</span>
              </div>
            </div>

            <div className="field-row" style={{ marginTop: '5px' }}>
              <div className="field-item flex-1">
                <span className="field-label">19. Yrs Studied in KA:</span>
                <span className="field-value">{data.studyEligibility?.yearsStudiedInKarnataka}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">20. Max Marks:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.sslcMaxMarks)}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">21. Obt Marks:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.sslcObtainedMarks)}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">22. %:</span>
                <span className="field-value">{calculatePercentage(data.educationalParticulars?.sslcObtainedMarks, data.educationalParticulars?.sslcMaxMarks)}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">23. Marks in Maths:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.obtainedMathsMarks)}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">Max Marks in Maths:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.maxMathsMarks)}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">24. Marks in Science:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.obtainedScienceMarks)}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">Max Marks in Science:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.maxScienceMarks)}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">25. Total Max Marks in Science & Maths:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.totalMaxScienceMaths)}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">26. Total Marks Obtained in Science & Maths:</span>
                <span className="field-value">{formatMarks(data.educationalParticulars?.totalObtainedScienceMaths)}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">27. 5yr Exemption Rule:</span>
                <span className="field-value">{data.exemptionClaims?.isFiveYearExemption?.toUpperCase()}</span>
              </div>
              {data.exemptionClaims?.isFiveYearExemption?.toUpperCase() === "YES" && (
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
                <span className="field-value">{data.exemptionClaims?.isSNQ?.toUpperCase()}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">37. Category:</span>
                <span className="field-value">{data.categoryDetails?.category}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">38. Caste:</span>
                <span className="field-value">{data.categoryDetails?.casteName || "-"}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">39. Income:</span>
                <span className="field-value">{data.categoryDetails?.annualIncome}</span>
              </div>
            </div>

            <div className="field-row">
              <div className="field-item flex-1">
                <span className="field-label">40. 371(J) HK Claim:</span>
                <span className="field-value">{data.exemptionClaims?.isHyderabadKarnataka?.toUpperCase()}</span>
              </div>
              <div className="field-item flex-1">
                <span className="field-label">41. * Special Category:</span>
                <span className="field-value">{getSpecialCategories(data.specialCategory) || "NONE"}</span>
              </div>
            </div>

            <div className="border-black p-2 mt-3">
              <p className="field-label font-bold mb-1">8. Residential Address</p>
              <p className="field-value" style={{ marginLeft: 0, lineHeight: '1.4' }}>{data.contactDetails?.address}</p>
              <div className="field-item mt-2">
                <span className="field-label">Pincode:</span>
                <span className="field-value">{data.contactDetails?.pincode}</span>
              </div>
            </div>

            <div style={{ marginTop: '10px', marginBottom: '6px' }}>
              <p style={{ fontSize: '10px', lineHeight: '1.4' }} className="font-black text-center uppercase">
                I AGREE TO PRODUCE ORIGINAL CASTE/INCOME CERTIFICATE AT THE TIME OF 1ST ROUND COUNSELLING OTHERWISE SEAT WILL BE ALLOTTED ONLY UNDER GENERAL MERIT QUOTA.
              </p>
            </div>

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
                <div style={{ borderTop: '1px solid black', paddingTop: '5px' }}>
                  <p className="font-bold uppercase" style={{ fontSize: '10px' }}>Parent/Guardian Signature</p>
                </div>
              </div>
              <div className="text-center" style={{ width: '180px' }}>
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

          {/* PAGE 2: HALL TICKET (NEW) */}
          <div className="a4-container" style={{ pageBreakBefore: "always" }}>
            <div className="header-wrapper">
              <img src="/Seal_of_Karnataka.png" alt="Govt Logo" className="govt-logo" />
              <div className="header-main-flex">
                <img src="https://www.kptplacements.org/logo.jpg" alt="College Logo" className="college-logo" />
                <div className="header-center-text">
                  <p style={{ fontSize: '14px' }} className="font-bold uppercase">HALL TICKET - KPT CAT EXAM 2026</p>
                  <p style={{ fontSize: '12px' }}>GOVERNMENT OF KARNATAKA</p>
                  <p style={{ fontSize: '12px' }} className="mt-1">KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE</p>
                  <p style={{ fontSize: '10px' }} className="font-normal italic">(An Autonomous Institution Under AICTE, New Delhi)</p>
                </div>
                <img src="https://www.kptplacements.org/logo2.png" alt="75 Years Logo" className="college-logo" />
              </div>
            </div>

            <div style={{ borderTop: '1.5px solid black', marginTop: '10px' }}></div>

            <table className="ht-table">
              <tbody>
                <tr>
                  <th>Candidate Name</th>
                  <td className="font-bold">{data.basicDetails?.name}</td>
                </tr>
                <tr>
                  <th>SSLC Register Number</th>
                  <td>{data.educationalParticulars?.sslcRegisterNumber}</td>
                </tr>
                <tr>
                  <th>Father Name</th>
                  <td>{data.basicDetails?.fatherName}</td>
                </tr>
                <tr>
                  <th>Application Number</th>
                  <td className="font-bold">{data.applicationNumber}</td>
                </tr>
                <tr>
                  <th>Exam Centre</th>
                  <td>{data.examDetails?.examCenter || "KPT MANGALORE CAMPUS"}</td>
                </tr>
                <tr>
                  <th>Exam Date</th>
                  <td className="font-bold">{data.examDetails?.examDate || "TBA"}</td>
                </tr>
                <tr>
                  <th>Exam Time</th>
                  <td className="font-bold">{data.examDetails?.examTime || "TBA"}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '80px', padding: '0 20px' }}>
              <div className="text-center" style={{ width: '200px' }}>
                <div style={{ borderTop: '1px solid black', paddingTop: '5px' }}>
                  <p className="font-bold uppercase" style={{ fontSize: '10px' }}>Student Signature</p>
                </div>
              </div>
              <div className="text-center" style={{ width: '200px' }}>
                <div style={{ borderTop: '1px solid black', paddingTop: '5px' }}>
                  <p className="font-bold uppercase" style={{ fontSize: '10px' }}>Dean / Nodal Officer</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '50px', padding: '15px', border: '1px dashed black' }}>
              <p className="font-bold underline mb-2" style={{ fontSize: '12px' }}>Instructions to Candidates:</p>
              <ul style={{ fontSize: '11px', lineHeight: '1.8' }}>
                <li>1. Candidate must carry this Hall Ticket to the exam hall without fail.</li>
                <li>2. Report to the exam centre at least 30 minutes before the scheduled time.</li>
                <li>3. Bring a valid Government ID proof (Aadhaar Card/Passport) for verification.</li>
                <li>4. Mobile phones, calculators, or any electronic gadgets are strictly prohibited.</li>
                <li>5. Candidates must follow all instructions provided by the invigilator.</li>
              </ul>
            </div>
            
            <div style={{ position: 'absolute', bottom: '15mm', width: '85%', textAlign: 'center', fontSize: '10px', color: '#666' }}>
              <p>This is a computer-generated Hall Ticket. No physical signature is required unless specified.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}