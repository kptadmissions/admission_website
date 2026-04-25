// models/ExamResult.js

import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
    },

    regNo: {
      type: String,
      required: true,
      trim: true,
    },

    score: {
      type: Number,
      default: 0,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    answers: [
      {
        questionId: String,
        selected: String, // includes "SKIPPED"
      },
    ],

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/* ✅ PREVENT MULTIPLE ATTEMPTS */
examResultSchema.index(
  { email: 1, regNo: 1 },
  { unique: true }
);

export default mongoose.model("ExamResult", examResultSchema);