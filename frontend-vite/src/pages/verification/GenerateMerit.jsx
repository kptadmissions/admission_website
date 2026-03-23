import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FaTrophy, 
  FaExclamationTriangle, 
  FaFilePdf, 
  FaSearch, 
  FaFilter,
  FaCheckCircle 
} from "react-icons/fa";

export default function MeritManagement() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState("generate"); // 'generate' or 'list'
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ verified: 0, pending: 0, total: 0 });
  const [meritList, setMeritList] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // FETCH STATS & LIST
  const fetchData = async () => {
    try {
      const token = await getToken();
      
      // 1. Get Stats (You might need to create this endpoint or calculate from list)
      // For now, let's assume we get a summary or mock it based on list length
      const resList = await axios.get(`${import.meta.env.VITE_API_URL}/merit/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMeritList(resList.data.meritList);

      // Mocking stats for the 'Generate' view based on a hypothetical endpoint
      // In a real app, fetch this from /verification/stats
      setStats({
        verified: resList.data.meritList.length || 0, // This would actually come from 'verified' count before generation
        pending: 5, // Example
        total: 100 // Example
      });
      
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/merit/generate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(res.data.message);
      setShowModal(false);
      fetchData(); // Refresh list
      setActiveTab("list"); // Auto-switch to list view
    } catch (err) {
      toast.error(err.response?.data?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" /> Merit Management
          </h2>
          <p className="text-gray-500 text-sm">Generate ranks and manage seat allocation</p>
        </div>
        
        {/* TABS */}
        <div className="bg-white p-1 rounded-lg border shadow-sm flex">
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "generate" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Generate Merit
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition ${
              activeTab === "list" ? "bg-indigo-50 text-indigo-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            View Merit List
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {activeTab === "generate" ? (
        <GenerateView 
          stats={stats} 
          onGenerate={() => setShowModal(true)} 
          loading={loading}
          listCount={meritList.length} 
        />
      ) : (
        <ListView meritList={meritList} />
      )}

      {/* CONFIRMATION MODAL */}
      {showModal && (
        <ConfirmationModal 
          onClose={() => setShowModal(false)} 
          onConfirm={handleGenerate} 
          loading={loading} 
        />
      )}
    </div>
  );
}

/* ================= SUB-COMPONENTS ================= */

function GenerateView({ stats, onGenerate, listCount }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* LEFT: ACTION CARD */}
      <div className="bg-white p-8 rounded-xl border shadow-sm flex flex-col items-center text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
          <FaTrophy className="text-4xl text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Generate Merit List</h3>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
            This will calculate scores for all <b>VERIFIED</b> students and assign permanent ranks.
          </p>
        </div>

        {listCount > 0 ? (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <FaCheckCircle /> Merit List already generated ({listCount} students)
          </div>
        ) : (
          <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <FaExclamationTriangle /> Action cannot be undone
          </div>
        )}

        <button
          onClick={onGenerate}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg transition transform active:scale-95"
        >
          {listCount > 0 ? "Regenerate Merit List" : "Generate Merit List"}
        </button>
      </div>

      {/* RIGHT: GUIDELINES & STATS */}
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
          <h4 className="font-semibold text-blue-900 mb-4">Calculation Logic</h4>
          <ul className="space-y-3 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">1</span>
              <span>Base Score = SSLC/10th Percentage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">3</span>
              <span>Sorted High to Low to assign Ranks</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ListView({ meritList }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");

  const filteredList = useMemo(() => {
    return meritList.filter(item => {
      const matchesSearch = item.personalDetails?.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = filterCat === "ALL" || item.categoryDetails?.category === filterCat;
      return matchesSearch && matchesCat;
    });
  }, [meritList, search, filterCat]);

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      {/* TOOLBAR */}
      <div className="p-4 border-b flex flex-col md:flex-row gap-4 justify-between bg-gray-50">
        <div className="flex gap-4 flex-1">
          {/* SEARCH */}
          <div className="relative flex-1 max-w-sm">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search student..." 
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {/* FILTER */}
          <div className="relative w-40">
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
            <select 
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="GM">GM</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="Cat-1">Cat-1</option>
              <option value="2A">2A</option>
              <option value="2B">2B</option>
            </select>
          </div>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition">
          <FaFilePdf /> Export PDF
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-3">Rank</th>
              <th className="px-6 py-3">Student Name</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3 text-center">SSLC %</th>
              <th className="px-6 py-3 text-right">Merit Score</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredList.length > 0 ? (
              filteredList.map((app) => {
                
                
                
                return (
                  <tr key={app._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-bold text-indigo-600">#{app.rank}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{app.personalDetails?.name}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-semibold border">
                        {app.categoryDetails?.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">{app.academicDetails?.sslcPercentage}%</td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">{app.meritScore.toFixed(2)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  No students found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t bg-gray-50 text-xs text-gray-500 flex justify-between">
        <span>Showing {filteredList.length} students</span>
      </div>
    </div>
  );
}

function ConfirmationModal({ onClose, onConfirm, loading }) {
  const [confirmText, setConfirmText] = useState("");
  const isMatch = confirmText === "GENERATE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in slide-in-from-bottom-4">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="text-red-600 text-xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Are you absolutely sure?</h3>
          <p className="text-gray-500 text-sm mb-6">
            This action will calculate scores and <b>overwrite existing ranks</b> for all verified students. This process cannot be easily undone.
          </p>
          
          <div className="text-left mb-6">
            <label className="text-xs font-bold text-gray-700 uppercase block mb-2">
              Type <span className="text-red-600 select-all">GENERATE</span> to confirm
            </label>
            <input 
              type="text" 
              className="w-full border rounded-lg p-2 text-center font-bold tracking-widest focus:ring-2 focus:ring-red-500 outline-none uppercase"
              placeholder="GENERATE"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            />
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={!isMatch || loading}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition ${
                isMatch && !loading 
                  ? "bg-red-600 hover:bg-red-700 shadow-md" 
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Processing..." : "Confirm Generation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}