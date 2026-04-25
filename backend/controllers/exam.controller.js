// controllers/examController.js

import ExamQuestion from "../models/ExamQuestion.js";
import ExamResult from "../models/ExamResult.js";
import ExamSettings from "../models/ExamSettings.js";
import xlsx from "xlsx";

/* =========================
GET SETTINGS
========================= */
export const getExamSettings = async (req, res) => {
  try {
    let settings = await ExamSettings.findOne();
    if (!settings) settings = await ExamSettings.create({});
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

/* =========================
UPDATE SETTINGS (ADMIN)
========================= */
export const updateExamSettings = async (req, res) => {
  try {
    const { isExamOpen, duration, totalQuestions } = req.body;

    const settings = await ExamSettings.findOneAndUpdate(
      {},
      {
        ...(isExamOpen !== undefined && { isExamOpen }),
        ...(duration && { duration }),
        ...(totalQuestions && { totalQuestions }),
      },
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
};

/* =========================
UPLOAD QUESTIONS (EXCEL)
========================= */
export const uploadQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File required" });
    }

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const formatted = data.map((q) => ({
      question: q.question,
      options: [q.optionA, q.optionB, q.optionC, q.optionD],
      correctAnswer: q[`option${q.correct}`],
    }));

    await ExamQuestion.deleteMany();
    await ExamQuestion.insertMany(formatted);

    res.json({
      success: true,
      count: formatted.length,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};

/* =========================
GET ALL QUESTIONS (ADMIN)
========================= */
export const getAllQuestions = async (req, res) => {
  try {
    const questions = await ExamQuestion.find().sort({ createdAt: -1 });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

/* =========================
UPDATE QUESTION (ADMIN)
========================= */
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options, correctAnswer } = req.body;

    const updated = await ExamQuestion.findByIdAndUpdate(
      id,
      { question, options, correctAnswer },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
};

/* =========================
DELETE QUESTION (ADMIN)
========================= */
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    await ExamQuestion.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
};

/* =========================
START EXAM
========================= */
export const startExam = async (req, res) => {
  try {
    const { email, regNo } = req.body;

    if (!email || !regNo) {
      return res.status(400).json({
        error: "Email and Register Number required",
      });
    }

    // 🔒 prevent multiple attempts
    const exists = await ExamResult.findOne({
      $or: [{ email }, { regNo }],
    });

    if (exists) {
      return res.status(400).json({
        error: "Exam already taken",
      });
    }

    const settings = await ExamSettings.findOne();

    if (!settings || !settings.isExamOpen) {
      return res.status(400).json({
        error: "Exam is currently closed",
      });
    }

    const questions = await ExamQuestion.aggregate([
      { $sample: { size: settings.totalQuestions || 10 } },
    ]);

    const safeQuestions = questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
    }));

    res.json({
      questions: safeQuestions,
      duration: settings.duration || 10,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to start exam" });
  }
};

/* =========================
SUBMIT EXAM
========================= */
export const submitExam = async (req, res) => {
  try {
    let { email, regNo, answers } = req.body;

    if (!email || !regNo) {
      return res.status(400).json({
        error: "Missing user details",
      });
    }

    if (!answers) {
  answers = [];
}

    // 🔒 prevent duplicate submit
    const exists = await ExamResult.findOne({
      $or: [{ email }, { regNo }],
    });

    if (exists) {
      return res.status(400).json({
        error: "Exam already submitted",
      });
    }

    const questionIds = answers.map((a) => a.questionId);

    const questions = await ExamQuestion.find({
      _id: { $in: questionIds },
    });

    let score = 0;

    questions.forEach((q) => {
      const ans = answers.find(
        (a) => a.questionId === q._id.toString()
      );

      if (!ans || ans.selected === "SKIPPED") return;

      if (
        ans.selected.trim().toLowerCase() ===
        q.correctAnswer.trim().toLowerCase()
      ) {
        score++;
      }
    });

    const settings = await ExamSettings.findOne();

    const result = await ExamResult.create({
      email,
      regNo,
      score,
      totalQuestions: settings?.totalQuestions || questions.length,
      answers,
    });

    res.json({
      success: true,
      score,
      total: result.totalQuestions,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Submit failed" });
  }
};

/* =========================
GET RESULT
========================= */
export const getExamResult = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: "Email required",
      });
    }

    const result = await ExamResult.findOne({ email });

    res.json(result || null);

  } catch (err) {
    res.status(500).json({ error: "Failed to fetch result" });
  }
};