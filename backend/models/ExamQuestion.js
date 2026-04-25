import mongoose from "mongoose";

const examQuestionSchema = new mongoose.Schema({
  question: String,
  options: [String], // 4 options
  correctAnswer: String
});

export default mongoose.model("ExamQuestion", examQuestionSchema);