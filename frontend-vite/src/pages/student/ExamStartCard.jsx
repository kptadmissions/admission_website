//path: frontend-vite/src/pages/student/ExamStartCard.jsx
import { motion } from "framer-motion";
import { BookOpen, Calendar, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { ChevronRight } from "lucide-react";
export default function ExamStartCard({ settings, onStartClick, showDobInput, dob, setDob, handleStartExam, loading }) {
  const isOpen = settings?.isExamOpen;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-2xl text-center"
    >
      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <BookOpen size={32} />
      </div>

      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent mb-2">
        Entrance Examination
      </h1>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Please ensure you have a stable internet connection before starting. The timer will begin immediately.
      </p>

      {!showDobInput ? (
        <div className="space-y-6">
          <div className="flex justify-center gap-4">
            <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Duration</span>
              <span className="text-xl font-bold text-gray-800">{settings?.duration || 0} Mins</span>
            </div>
            <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
              <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Questions</span>
              <span className="text-xl font-bold text-gray-800">{settings?.totalQuestions || 0}</span>
            </div>
          </div>

          {isOpen ? (
            <button
              onClick={onStartClick}
              className="w-full max-w-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 group mx-auto"
            >
              Start Examination <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 flex items-center gap-3 justify-center">
              <AlertCircle size={20} />
              <span className="font-bold">Exam is currently closed</span>
            </div>
          )}
        </div>
      ) : (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-4 max-w-xs mx-auto">
          <label className="block text-left text-sm font-bold text-gray-700 ml-1">
  Enter SSLC Register Number
</label>

<div className="relative">
  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
  <input 
    type="text"
    placeholder="Enter SSLC Reg No"
    value={dob}
    onChange={(e) => setDob(e.target.value)}
    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
  />
</div>
          <button
            onClick={handleStartExam}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Verify & Begin"}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}