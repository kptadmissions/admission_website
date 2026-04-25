import mongoose from "mongoose";

const examSettingsSchema = new mongoose.Schema({
  isExamOpen: {
    type: Boolean,
    default: false,
  },
  duration: {
    type: Number,
    default: 30,
  },
  totalQuestions: {
    type: Number,
    default: 20,
  },
}, { timestamps: true });

export default mongoose.model("ExamSettings", examSettingsSchema);