// path: frontend-vite/src/pages/student/ExamResultCard.jsx

import { motion } from "framer-motion";
import { CheckCircle2, Award } from "lucide-react";

export default function ExamResultCard({ result }) {
  const percentage = (result.score / result.totalQuestions) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-md w-full mx-auto bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-xl text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm ring-8 ring-green-50/50"
      >
        <CheckCircle2 size={40} strokeWidth={2.5} />
      </motion.div>

      <h2 className="text-2xl font-bold text-slate-800 mb-2">Exam Completed</h2>
      <p className="text-slate-500 mb-8">Your responses have been recorded successfully.</p>

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
        <span className="text-xs text-slate-500 font-bold uppercase tracking-widest block mb-3">
          Final Score
        </span>
        
        <div className="flex items-baseline justify-center gap-2 mb-4">
          <span className="text-5xl font-black text-blue-600">{result.score}</span>
          <span className="text-xl font-bold text-slate-400">/ {result.totalQuestions}</span>
        </div>

        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
            className={`h-full rounded-full ${
              percentage >= 50 ? "bg-green-500" : "bg-blue-500"
            }`}
          />
        </div>
        <p className="text-xs text-slate-400 font-medium mt-3 text-right">
          {percentage.toFixed(0)}% Accuracy
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 text-left shadow-sm">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-500">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Status</p>
            <p className="font-semibold text-slate-700">
               {percentage >= 50 ? "Qualified for Merit" : "Attempt Recorded"}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}