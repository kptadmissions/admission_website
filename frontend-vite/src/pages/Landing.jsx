import React, { useEffect, useState } from "react";
import FullPageLoader from "../components/FullPageLoader";

export default function Landing() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for a few moments (2 seconds)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // ✅ Full page loader with new message
  if (loading) {
    return (
      <FullPageLoader label="Welcome to KPT Mangalore Admission Website..." />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 relative overflow-hidden">
      
      {/* Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle, #a5b4fc 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <section className="relative max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-12 items-center">

        {/* LEFT */}
        <div className="space-y-5 text-center md:text-left">

          {/* Static Admission Status */}
          <span className="px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs font-bold animate-pulse inline-block">
            ADMISSIONS OPEN
          </span>

          <p className="uppercase tracking-widest text-indigo-600 font-semibold text-sm">
            Government Polytechnic Institution
          </p>

          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 break-words leading-snug">
            KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE
          </h1>

          <p className="text-sm text-gray-500 font-medium">
            (An Autonomous Institution Under AICTE, New Delhi)
          </p>

        </div>

        {/* RIGHT IMAGE */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-indigo-400 blur-[80px] opacity-20 rounded-full"></div>

          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSohoo_3dE0QLEFuPAGCQQZXaCbHBiWD__74w&s"
            alt="KPT Mangalore"
            className="relative z-10 max-w-md w-full rounded-2xl shadow-xl border"
          />
        </div>

      </section>
    </div>
  );
}