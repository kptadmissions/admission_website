import React, { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BarChart3, Search, Download, FileText, ChevronUp, 
  ChevronDown, Filter, Users
} from "lucide-react";
import * as XLSX from "xlsx";
import html2pdf from "html2pdf.js";
import CountUp from "react-countup";

// Note: Replace this with your actual auth hook if needed
const useAuth = () => ({ getToken: async () => "mock-token" });

const SPECIAL_CATEGORIES_LIST = [
  "JTS", "JOC", "EDP", "DP", "PS", "SP", "SG", "AI", 
  "CI", "GK", "ITI", "NCC", "PH"
];

export default function ApplicationStatistics() {
  const { getToken } = useAuth();
  
  // Base Data State
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // API Query State (Top Controls)
  const [apiFilters, setApiFilters] = useState({
    fromDate: "",
    toDate: "",
    search: ""
  });
  
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");
  const limit = 20;

  // Frontend Table Filters (Excel Style)
  const [tableFilters, setTableFilters] = useState({
    appNumberType: "",
    category: "",
    type: "",
    isRural: "",
    isKannadaMedium: "",
    isHK: "",
    specialCat: "",
  });

  // Fetch from API
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      
      const params = new URLSearchParams({
        page,
        limit,
        sortBy,
        order,
      });

      if (apiFilters.fromDate) params.append("fromDate", apiFilters.fromDate);
      if (apiFilters.toDate) params.append("toDate", apiFilters.toDate);
      if (apiFilters.search) params.append("search", apiFilters.search);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/applications?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const resData = await res.json();
      
      if (!res.ok) throw new Error(resData.error || "Failed to fetch data");

      setApplications(resData.data || []);
      setTotal(resData.total || 0);
    } catch (err) {
      toast.error(err.message || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, order]);

  // Handlers
  const handleApplyApiFilters = (e) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleResetApiFilters = () => {
    setApiFilters({ fromDate: "", toDate: "", search: "" });
    setTableFilters({ appNumberType: "", category: "", type: "", isRural: "", isKannadaMedium: "", isHK: "", specialCat: "" });
    setPage(1);
    fetchApplications();
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setOrder("asc");
    }
  };

  const updateTableFilter = (field, value) => {
    setTableFilters(prev => ({ ...prev, [field]: value }));
  };

  // Helper Logic
  const getType = (appNum = "") => appNum.startsWith("C") ? "Reserved" : appNum.startsWith("G") ? "GM" : "Unknown";
  
  const getSpecialCategories = (sc) => {
    if (!sc) return [];
    return Object.entries(sc)
      .filter(([_, val]) => val === true || val === "Yes")
      .map(([key]) => key);
  };

  // Apply Frontend Filters
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const type = getType(app.applicationNumber);
      const userSpecialCats = getSpecialCategories(app.specialCategory);

      // Application Number Type Filter (103 or 186)
      if (tableFilters.appNumberType === "103" && !app.applicationNumber.includes("103")) return false;
      if (tableFilters.appNumberType === "186" && !app.applicationNumber.includes("186")) return false;

      if (tableFilters.category && app.categoryDetails?.category !== tableFilters.category) return false;
      if (tableFilters.type && type !== tableFilters.type) return false;
      
      if (tableFilters.isRural && app.studyEligibility?.isRural !== tableFilters.isRural) return false;
      if (tableFilters.isKannadaMedium && app.studyEligibility?.isKannadaMedium !== tableFilters.isKannadaMedium) return false;
      if (tableFilters.isHK && app.exemptionClaims?.isHyderabadKarnataka !== tableFilters.isHK) return false;
      
      // Dynamic Special Category Filter Logic
      if (tableFilters.specialCat) {
        if (tableFilters.specialCat === "NONE") {
          if (userSpecialCats.length > 0) return false;
        } else {
          if (!userSpecialCats.includes(tableFilters.specialCat)) return false;
        }
      }

      return true;
    });
  }, [applications, tableFilters]);

  // Exports
  const exportToExcel = () => {
    const exportData = filteredApplications.map((app) => ({
      "Application Number": app.applicationNumber,
      "Name": app.basicDetails?.name || "N/A",
      "Category": app.categoryDetails?.category || "-",
      "Type": getType(app.applicationNumber),
      "Rural": app.studyEligibility?.isRural || "-",
      "Kannada Medium": app.studyEligibility?.isKannadaMedium || "-",
      "HK Region": app.exemptionClaims?.isHyderabadKarnataka || "-",
      "Special Category": getSpecialCategories(app.specialCategory).join(", ") || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Statistics");
    XLSX.writeFile(workbook, "Filtered_Application_Statistics.xlsx");
  };

  const exportToPDF = () => {
    const element = document.getElementById("statistics-table");
    const opt = {
      margin: 0.5,
      filename: 'Application_Statistics.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  // Reusable Components
  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return order === "asc" ? <ChevronUp className="w-4 h-4 ml-1 inline text-indigo-600" /> : <ChevronDown className="w-4 h-4 ml-1 inline text-indigo-600" />;
  };

  const HeaderCell = ({ title, column, filterKey, filterOptions }) => (
    <th className="p-4 bg-gray-50 align-top min-w-[140px] text-left border-b font-semibold text-gray-700">
      <div 
        className={`flex justify-between items-center ${column ? 'cursor-pointer hover:text-indigo-600 transition-colors' : ''}`}
        onClick={() => column && handleSort(column)}
      >
        <span>{title}</span>
        {column && <SortIcon column={column} />}
      </div>
      {filterKey && filterOptions && (
        <div className="mt-2" onClick={(e) => e.stopPropagation()}>
          <select 
            value={tableFilters[filterKey] || ""}
            onChange={(e) => updateTableFilter(filterKey, e.target.value)}
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 font-normal text-gray-600 bg-white"
          >
            <option value="">All</option>
            {filterOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}
    </th>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 py-10 space-y-8"
    >
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-indigo-700 text-3xl font-bold">
          <BarChart3 size={36} />
          Application Statistics
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl shadow hover:bg-emerald-700 transition-colors font-medium">
            <Download size={18} /> Export Excel
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl shadow hover:bg-rose-700 transition-colors font-medium">
            <FileText size={18} /> Export PDF
          </motion.button>
        </div>
      </div>

      {/* 2. DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Applications Card */}
        <motion.div 
          whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden md:col-span-1 lg:col-span-1"
        >
          <div className="absolute -right-4 -top-4 opacity-20">
            <Users size={140} />
          </div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-2 text-indigo-100 font-medium text-lg mb-2">
              <Users size={22} /> Total Applications
            </div>
            <div className="text-5xl font-extrabold tracking-tight">
              <CountUp end={total} duration={2} separator="," />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. TOP FILTER BAR (Clean Horizontal Layout) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-5 border flex flex-wrap gap-4 items-center"
      >
        <form onSubmit={handleApplyApiFilters} className="flex flex-wrap items-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-semibold">From</label>
            <input type="date" value={apiFilters.fromDate} onChange={(e) => setApiFilters({ ...apiFilters, fromDate: e.target.value })} className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow" />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 font-semibold">To</label>
            <input type="date" value={apiFilters.toDate} onChange={(e) => setApiFilters({ ...apiFilters, toDate: e.target.value })} className="border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow" />
          </div>

          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search App Number or Name..."
              value={apiFilters.search}
              onChange={(e) => setApiFilters({ ...apiFilters, search: e.target.value })}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-shadow"
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <motion.button type="button" onClick={handleResetApiFilters} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="border border-gray-200 text-gray-700 px-6 py-2 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold">
              Reset
            </motion.button>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-indigo-700 transition-colors text-sm font-semibold">
              Fetch Data
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* 4. MAIN TABLE CARD */}
      <motion.div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border overflow-hidden">
        <div className="overflow-x-auto" id="statistics-table">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead>
              <tr>
                <HeaderCell 
                  title="App No Type" 
                  column="applicationNumber" 
                  filterKey="appNumberType"
                  filterOptions={[
                    {label: "103", value: "103"}, 
                    {label: "186", value: "186"}
                  ]}
                />
                <HeaderCell title="Name" column="basicDetails.name" />
                <HeaderCell 
                  title="Category" column="categoryDetails.category" filterKey="category"
                  filterOptions={[
                    {label: "GM", value: "GM"}, {label: "SC", value: "SC"}, {label: "ST", value: "ST"}, 
                    {label: "C-1", value: "C-1"}, {label: "2A", value: "2A"}, {label: "2B", value: "2B"}, 
                    {label: "3A", value: "3A"}, {label: "3B", value: "3B"}
                  ]}
                />
                <HeaderCell 
                  title="Type" column="type_placeholder" filterKey="type"
                  filterOptions={[{label: "GM", value: "GM"}, {label: "Reserved", value: "Reserved"}]}
                />
                <HeaderCell 
                  title="Rural" column="studyEligibility.isRural" filterKey="isRural"
                  filterOptions={[{label: "Yes", value: "Yes"}, {label: "No", value: "No"}]}
                />
                <HeaderCell 
                  title="Kan. Med" column="studyEligibility.isKannadaMedium" filterKey="isKannadaMedium"
                  filterOptions={[{label: "Yes", value: "Yes"}, {label: "No", value: "No"}]}
                />
                <HeaderCell 
                  title="HK Region" column="exemptionClaims.isHyderabadKarnataka" filterKey="isHK"
                  filterOptions={[{label: "Yes", value: "Yes"}, {label: "No", value: "No"}]}
                />
                <HeaderCell 
                  title="Spl Category" column="special_placeholder" filterKey="specialCat"
                  filterOptions={[
                    ...SPECIAL_CATEGORIES_LIST.map(cat => ({ label: cat, value: cat })),
                    { label: "None", value: "NONE" }
                  ]}
                />
              </tr>
            </thead>
            
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-16 text-center text-indigo-600 font-semibold animate-pulse">
                    <div className="flex items-center justify-center gap-3 text-lg">
                      <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading records...
                    </div>
                  </td>
                </tr>
              ) : filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-16 text-center text-gray-500">
                    <Filter className="mx-auto mb-3 text-gray-400" size={40} />
                    <p className="text-lg font-medium">No applications found</p>
                    <p className="text-sm mt-1 text-gray-400">Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredApplications.map((app, i) => {
                    const type = getType(app.applicationNumber);
                    
                    const userSpecialCats = getSpecialCategories(app.specialCategory);
                    const hasSpecialCat = userSpecialCats.length > 0;

                    return (
                      <motion.tr
                        key={app.applicationNumber || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.2) }}
                        className={`border-b transition-colors hover:bg-indigo-50 ${hasSpecialCat ? "bg-amber-50/50" : "bg-white"}`}
                      >
                        <td className="p-4 font-semibold text-indigo-700">{app.applicationNumber}</td>
                        <td className="p-4 text-gray-800 font-medium">{app.basicDetails?.name || "-"}</td>
                        <td className="p-4 text-gray-600">{app.categoryDetails?.category || "-"}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${type === "GM" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                            {type}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700">
                          {app.studyEligibility?.isRural === "Yes" ? (
                            <span className="text-emerald-600 font-semibold">Yes</span>
                          ) : (
                            app.studyEligibility?.isRural || "-"
                          )}
                        </td>
                        <td className="p-4 text-gray-700">{app.studyEligibility?.isKannadaMedium || "-"}</td>
                        <td className="p-4 text-gray-700">{app.exemptionClaims?.isHyderabadKarnataka || "-"}</td>
                        <td className="p-4">
                          {hasSpecialCat ? (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-800 tracking-wide">
                              {userSpecialCats.join(", ")}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* 5. PAGINATION */}
        {!loading && total > 0 && (
          <div className="flex items-center justify-between p-5 border-t bg-gray-50/80">
            <span className="text-sm text-gray-600">
              Showing page <span className="font-bold text-gray-900">{page}</span> 
              {" "}out of <span className="font-bold text-gray-900">{Math.ceil(total / limit) || 1}</span> 
              <span className="mx-2 text-gray-300">|</span> 
              Total Records: <span className="font-bold text-indigo-600">{total}</span>
            </span>
            <div className="flex items-center gap-3">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors bg-white font-semibold shadow-sm text-gray-700"
              >
                Previous
              </button>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-50 hover:bg-gray-100 transition-colors bg-white font-semibold shadow-sm text-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}