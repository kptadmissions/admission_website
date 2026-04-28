import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, unique: true, sparse: true },

    name: {
      type: String,
      required: true,   // 🔥 important
      trim: true,
    },

    email: { type: String, required: true, unique: true },

    role: {
      type: String,
      enum: ["student", "admin", "verification_officer"],
      default: "student",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);