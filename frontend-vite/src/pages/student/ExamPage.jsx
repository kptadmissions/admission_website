//path: frontend-vite/src/pages/student/ExamPage.jsx
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";

import { 
  Timer, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  BookOpen,
  Info
} from "lucide-react";

import ExamStartCard from "./ExamStartCard";
import ExamQuestionCard from "./ExamQuestionCard";
import ExamResultCard from "./ExamResultCard";

export default function ExamPage() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress;

  // States
  const [examSettings, setExamSettings] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const answersRef = useRef({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [regNo, setRegNo] = useState("");
  const [showDobInput, setShowDobInput] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);
  const submittedRef = useRef(false); // 🔥 prevents duplicate submit

  useEffect(() => {
    fetchInitialData();
  }, [email]);

  const fetchInitialData = async () => {
    if (!email) return;
    try {
      setLoading(true);
      // 1. Check if exam is open/settings
      const settingsRes = await axios.get(`${import.meta.env.VITE_API_URL}/exam/settings`);
      setExamSettings(settingsRes.data);

      // 2. Check if student already has a result
      const resultRes = await axios.get(`${import.meta.env.VITE_API_URL}/exam/result?email=${email}`);
      if (resultRes.data) {
        setResult(resultRes.data);
      }
    } catch (err) {
      console.error("Initialization failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    if (!regNo) return toast.warning("Enter SSLC Register Number");

    try {
      setLoading(true);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/exam/start`,
        { email, regNo }
      );

      setQuestions(res.data.questions);
      setTimeLeft(res.data.duration * 60);
      setStarted(true);
      setShowDobInput(false);

    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start exam");
    } finally {
      setLoading(false);
    }
  };

  const submitExam = async () => {
    if (submittedRef.current && submitting) return;

    submittedRef.current = true; // 🔥 force lock
    setSubmitting(true);

    try {
      const formattedAnswers = Object.keys(answersRef.current).map((qid) => ({
        questionId: qid,
        selected: answersRef.current[qid]
      }));

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/exam/submit`,
        { email, regNo, answers: formattedAnswers }
      );

      setResult(res.data);
      setStarted(false);
      toast.success("Exam submitted!");

    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (!started) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);

          // 🔥 GUARANTEED SUBMIT (only once)
          if (!submittedRef.current) {
            submittedRef.current = true;
            submitExam();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started]);

  // Loading Screen
  if (loading && !started) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
        <p className="text-slate-600 font-medium tracking-wide">Preparing secure exam portal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 min-h-screen flex flex-col font-sans">
      <AnimatePresence mode="wait">
        
        {/* STATE 1: RESULT VIEW */}
        {result && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExamResultCard result={result} />
          </motion.div>
        )}

        {/* STATE 2: BEFORE START */}
        {!result && !started && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ExamStartCard 
              settings={examSettings} 
              loading={loading}
              onStartClick={() => setShowDobInput(true)}
              showDobInput={showDobInput}
              dob={regNo}
              setDob={setRegNo}
              handleStartExam={handleStartExam}
            />
          </motion.div>
        )}

        {/* STATE 3: DURING EXAM */}
        {started && !result && (
          <motion.div 
            key="exam"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col flex-1"
          >
            {/* STICKY HEADER */}
            <div className="sticky top-2 z-30 bg-white/95 backdrop-blur-md border border-slate-200 px-5 py-3 shadow-sm rounded-xl flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 hidden sm:block">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h1 className="font-bold text-slate-800 leading-tight">Entrance Examination</h1>
                  <p className="text-[11px] sm:text-xs text-red-500 flex items-center gap-1 font-medium mt-0.5">
                    <AlertCircle size={12} /> Proctored Environment - Do not refresh
                  </p>
                </div>
              </div>
              <div className={`px-4 py-2 rounded-lg flex items-center gap-2 font-mono font-bold text-base sm:text-lg border-2 transition-all duration-300 ${
                timeLeft < 60 
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.2)]' 
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <Timer size={18} className={timeLeft < 60 ? "text-red-500" : "text-slate-400"} />
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            </div>

            {/* MAIN EXAM LAYOUT */}
            <div className="flex flex-col lg:flex-row gap-6 relative flex-1">
              
              {/* LEFT SIDE: Question Box */}
              <div className="flex-1 min-w-0">
                <ExamQuestionCard
                  question={questions[currentIndex]}
                  index={currentIndex}
                  total={questions.length}
                  selectedOption={answers[questions[currentIndex]?._id]}
                  onSelect={(opt) => {
                    const updated = {
                      ...answersRef.current,
                      [questions[currentIndex]._id]: opt,
                    };
                    answersRef.current = updated;
                    setAnswers(updated);
                    localStorage.setItem("exam_answers", JSON.stringify(updated));
                  }}
                  onNext={() => setCurrentIndex((i) => i + 1)}
                  onPrevious={() => setCurrentIndex((i) => i - 1)}
                  onSkip={() => {
                    const qid = questions[currentIndex]._id;
                    const updated = {
                      ...answersRef.current,
                      [qid]: "SKIPPED",
                    };
                    answersRef.current = updated;
                    setAnswers(updated);
                    localStorage.setItem("exam_answers", JSON.stringify(updated));
                    setCurrentIndex((i) => i + 1);
                  }}
                  // Passing null here to avoid duplicate timers if you prefer, 
                  // or keep it to strictly maintain previous props:
                  timer={`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, "0")}`}
                />
              </div>

              {/* RIGHT SIDE: Sidebar / Question Palette */}
              <div className="w-full lg:w-80 shrink-0">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 lg:sticky lg:top-24">
                  
                  <h3 className="font-semibold text-slate-800 mb-3 hidden lg:block">Question Palette</h3>
                  
                  {/* Legend */}
                  <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500 mb-5 pb-4 border-b border-slate-100 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-green-500"></div> Answered
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded bg-slate-400"></div> Skipped
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded border border-slate-300 bg-white"></div> Pending
                    </div>
                  </div>

                  {/* Grid / Horizontal Scroll on Mobile */}
                  <div className="flex flex-row lg:grid lg:grid-cols-5 gap-2 overflow-x-auto pb-3 lg:pb-0 scrollbar-hide">
                    {questions.map((q, i) => {
                      const val = answers[q._id];
                      
                      // Status colors
                      const isSkipped = val === "SKIPPED";
                      const isAnswered = val && val !== "SKIPPED";
                      
                      const statusClass = isSkipped
                        ? "bg-slate-400 text-white border-slate-400 shadow-sm"
                        : isAnswered
                        ? "bg-green-500 text-white border-green-500 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300";

                      const activeClass = currentIndex === i 
                        ? "ring-2 ring-blue-600 ring-offset-2 border-transparent scale-110 z-10" 
                        : "scale-100";

                      return (
                        <button
                          key={q._id}
                          onClick={() => setCurrentIndex(i)}
                          className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg border font-bold text-sm transition-all duration-200 ${statusClass} ${activeClass}`}
                          aria-label={`Go to question ${i + 1}`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* FINAL SUBMIT SECTION */}
            <div className="mt-12 bg-white border border-slate-200 rounded-xl p-8 shadow-sm text-center max-w-3xl mx-auto w-full">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-full mb-4">
                <Info size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to Submit?</h3>
              <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
                Ensure you have reviewed all skipped or pending questions before submitting. This action is final and cannot be undone.
              </p>
              
              <button
                onClick={submitExam}
                disabled={submitting}
                className="group relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-200 bg-slate-800 border border-transparent rounded-lg hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Processing Submit...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 group-hover:scale-110 transition-transform" size={20} />
                    Confirm & Submit Exam
                  </>
                )}
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}