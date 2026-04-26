// models/AdmissionSettings.js

import mongoose from "mongoose";

const admissionSettingsSchema = new mongoose.Schema(
  {
    normalActive: {
      type: Boolean,
      default: true,
    },
    lateralActive: {
      type: Boolean,
      default: false,
    },
    academicYear: {
      type: String,
      default: "2025-26",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AdmissionSettings", admissionSettingsSchema);
