import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const FilterPanel = ({ filters, setFilters, onApply, onReset }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const inputClass = "bg-slate-900 border border-white/10 text-white text-sm rounded-lg focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 outline-none transition-all";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
        <Filter className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Advanced Filters</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Dropdowns */}
        {['category', 'gender', 'district', 'shift', 'rural', 'kannada', 'special'].map((field) => (
          <div key={field}>
            <label className="block mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">{field}</label>
            <select name={field} value={filters[field]} onChange={handleChange} className={inputClass}>
              <option value="">All {field}</option>
              {/* These would ideally be populated from a meta-data API */}
              <option value="GM">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
            </select>
          </div>
        ))}

        {/* Income Range */}
        <div>
          <label className="block mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Min Income</label>
          <input type="number" name="minIncome" value={filters.minIncome} onChange={handleChange} placeholder="0" className={inputClass} />
        </div>
        <div>
          <label className="block mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Max Income</label>
          <input type="number" name="maxIncome" value={filters.maxIncome} onChange={handleChange} placeholder="999999" className={inputClass} />
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button onClick={onReset} className="flex items-center px-6 py-2.5 text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </button>
        <button onClick={onApply} className="flex items-center px-8 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl shadow-lg shadow-purple-500/20 transition-all">
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;