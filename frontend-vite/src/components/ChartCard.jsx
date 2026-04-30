import React from 'react';

const ChartCard = ({ title, children }) => {
  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md p-6 rounded-2xl">
      <h3 className="text-slate-300 font-semibold mb-6 text-lg tracking-wide">{title}</h3>
      <div className="h-[300px] w-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;