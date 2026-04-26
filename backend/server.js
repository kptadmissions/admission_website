import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { clerkMiddleware } from "@clerk/express";

// Routes
import meritRoutes from "./routes/merit.routes.js";
import examRoutes from "./routes/exam.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
// import applicationRoutes from "./routes/application.routes.js";
import seatRoutes from "./routes/seat.routes.js";
import studentSeatRoutes from "./routes/student-seat.routes.js";
import verificationRoutes from "./routes/verification.routes.js";
import finalRoutes from "./routes/final.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import applicationRoutes from "./routes/application.officer.routes.js";
import adminSeatRoutes from "./routes/admin.seat.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import adminAdmissionRoutes from "./routes/admin.admission.routes.js";

const app = express();

// =============================
// ✅ CONNECT DATABASE
// =============================
connectDB();

// =============================
// ✅ MIDDLEWARES
// =============================
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));

app.use(clerkMiddleware());

// =============================
// ✅ ROUTES
// =============================
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/student", studentSeatRoutes);
app.use("/api/admin/seats", adminSeatRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/final", finalRoutes);
app.use("/api/exam", examRoutes);
app.use("/api/merit", meritRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admission", adminAdmissionRoutes);

// =============================
// ✅ ROOT ROUTE
// =============================
app.get("/", (req, res) => {
  res.send("🚀 KPT Admissions Backend Running");
});

// =============================
// ✅ 404 HANDLER
// =============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// =============================
// ✅ GLOBAL ERROR HANDLER
// =============================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// =============================
// ✅ START SERVER
// =============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});