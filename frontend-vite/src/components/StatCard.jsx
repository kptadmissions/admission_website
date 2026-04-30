import React from 'react';
import { TrendingUp } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, onClick, isActive }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden cursor-pointer p-5 rounded-2xl border transition-all duration-300 
        ${isActive ? 'border-cyan-500 bg-cyan-500/10 scale-105' : 'border-white/10 bg-white/5 hover:bg-white/10'}
        backdrop-blur-md group`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white tracking-tight">{value || 0}</h3>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
      <div className="mt-4 flex items-center text-xs text-slate-500">
        <TrendingUp className="w-3 h-3 mr-1 text-emerald-400" />
        <span className="text-emerald-400 mr-1">Live</span> from system
      </div>
      {/* Neon Glow Effect */}
      <div className={`absolute -bottom-2 -right-2 w-16 h-16 blur-2xl opacity-20 rounded-full ${color}`}></div>
    </div>
  );
};

export default StatCard;