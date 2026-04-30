import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({ data, loading }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'submitted': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-xl font-bold text-white">Application Drill-down</h3>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input type="text" placeholder="Search by name or app number..." className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white focus:ring-1 focus:ring-cyan-500 outline-none" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase font-bold">
            <tr>
              <th className="px-6 py-4">App No</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Special</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Mobile</th>
              <th className="px-6 py-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">Loading records...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="7" className="px-6 py-12 text-center text-slate-500">No applications found.</td></tr>
            ) : (
              data.map((row, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-cyan-400">{row.applicationNo || 'N/A'}</td>
                  <td className="px-6 py-4 text-white font-medium">{row.name}</td>
                  <td className="px-6 py-4 text-slate-400">{row.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {row.special?.map(s => <span key={s} className="px-2 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px]">{s}</span>)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{row.mobile}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">{new Date(row.submittedDate).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;