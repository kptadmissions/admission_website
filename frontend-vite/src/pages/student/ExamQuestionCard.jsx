// path: frontend-vite/src/pages/student/ExamQuestionCard.jsx

import { motion } from "framer-motion";
import { Clock } from "lucide-react";

export default function ExamQuestionCard({
  question,
  index,
  total,
  selectedOption,
  onSelect,
  onNext,
  onPrevious,
  onSkip,
  timer
}) {
  if (!question) return null;

  const isFirst = index === 0;
  const isLast = index === total - 1;

  // Triggers pulse animation if timer format is "00:XX" (less than 1 minute)
  const isTimeRunningOut = timer && timer.startsWith("00:");

  return (
    <motion.div
      key={question._id || index}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col min-h-[500px]"
    >
      {/* HEADER (Sticky) */}
      <div className="flex justify-between items-center border-b border-slate-200 px-6 py-4 bg-slate-50/90 backdrop-blur-md rounded-t-xl sticky top-0 z-10">
        <div className="flex flex-col w-1/3">
          <span className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-1.5">
            Question {index + 1} of {total}
          </span>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${((index + 1) / total) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-blue-600 rounded-full"
            />
          </div>
        </div>

        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md border font-semibold tracking-wide transition-all ${
            isTimeRunningOut
              ? "bg-red-50 border-red-200 text-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.15)]"
              : "bg-white border-slate-200 text-slate-700"
          }`}
        >
          <Clock size={16} className={isTimeRunningOut ? "text-red-500" : "text-slate-400"} />
          {timer}
        </div>
      </div>

      {/* QUESTION & OPTIONS */}
      <div className="p-6 sm:p-8 flex-1 flex flex-col">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-8 leading-relaxed">
          {question.question}
        </h2>

        {/* Options Container pushes to bottom if question is short */}
        <div className="space-y-3 mt-auto">
          {question.options.map((opt, i) => {
            const isSelected = selectedOption === opt;

            return (
              <motion.label
                key={i}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.995 }}
                className={`group flex items-center gap-4 border rounded-lg px-5 py-4 cursor-pointer transition-all duration-200 shadow-sm
                ${
                  isSelected
                    ? "bg-blue-50/60 border-blue-600 ring-1 ring-blue-600"
                    : "bg-white border-slate-200 hover:border-blue-400 hover:bg-blue-50/30"
                }`}
              >
                {/* Custom Radio Button */}
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="radio"
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => onSelect(opt)}
                  />
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected ? "border-blue-600" : "border-slate-300 group-hover:border-blue-400"
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="w-2.5 h-2.5 bg-blue-600 rounded-full"
                      />
                    )}
                  </div>
                </div>

                <span
                  className={`text-base leading-snug ${
                    isSelected ? "text-blue-900 font-medium" : "text-slate-700"
                  }`}
                >
                  {opt}
                </span>
              </motion.label>
            );
          })}
        </div>
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-xl flex flex-col-reverse sm:flex-row justify-between items-center gap-3">
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 focus:ring-2 focus:ring-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        <div className="w-full sm:w-auto flex gap-3">
          <button
            onClick={onSkip}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
          >
            Skip
          </button>

          <button
            onClick={onNext}
            disabled={isLast || !selectedOption}
            className="flex-1 sm:flex-none px-8 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-sm hover:bg-blue-700 hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLast ? "Next" : "Next"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}