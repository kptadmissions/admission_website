import React, { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { BarChart3, Users, Loader2 } from "lucide-react";

export default function OfficerDashboard() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    name: "Officer",
    totalApplications: 0,
    myApplications: 0,
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/applications/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.success) {
          setDashboardData({
            name: res.data.data.name,
            totalApplications: res.data.data.totalApplications,
            myApplications: res.data.data.myApplications,
          });
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [getToken]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-500 font-semibold animate-pulse">Loading Dashboard...</p>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* TOP SECTION */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="border-b-2 border-slate-200 pb-6"
        >
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
            Welcome, <span className="text-indigo-600">{dashboardData.name}</span> 👋
          </h1>
          <p className="text-slate-500 font-medium mt-2 text-lg">
            Here is your verification and application overview.
          </p>
        </motion.div>

        {/* CARDS (3 GRID) */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {/* Card 1: Total Applications */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 overflow-hidden relative group hover:shadow-md transition-shadow"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <BarChart3 className="w-32 h-32 text-indigo-600" />
            </div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5 border border-indigo-100">
                <BarChart3 className="w-7 h-7 text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Total Applications
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800">
                <CountUp end={dashboardData.totalApplications} duration={2} separator="," />
              </h2>
            </div>
          </motion.div>

          {/* Card 2: My Applications */}
          <motion.div
            variants={cardVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 overflow-hidden relative group hover:shadow-md transition-shadow"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
              <Users className="w-32 h-32 text-emerald-600" />
            </div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-5 border border-emerald-100">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                My Applications
              </p>
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800">
                <CountUp end={dashboardData.myApplications} duration={2} separator="," />
              </h2>
            </div>
          </motion.div>
          
        </motion.div>
      </div>
    </div>
  );
}