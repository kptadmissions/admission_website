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
await connectDB();

// =============================
// ✅ CORS (ONLY ONE - CLEAN)
// =============================
const allowedOrigins = [
  "http://localhost:5173",
  "https://kptadmissions.vercel.app"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // don't crash server
    }
  },
  credentials: true,
}));

// =============================
// ✅ HANDLE PREFLIGHT (SAFE)
// =============================
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// =============================
// ✅ MIDDLEWARES
// =============================
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
// ✅ ROOT
// =============================
app.get("/", (req, res) => {
  res.send("🚀 KPT Admissions Backend Running on Vercel");
});

// =============================
// ✅ 404
// =============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// =============================
// ✅ ERROR HANDLER
// =============================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// =============================
// ✅ LOCAL SERVER (ONLY LOCAL)
// =============================
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

// =============================
// ✅ EXPORT (FOR VERCEL)
// =============================
export default app;