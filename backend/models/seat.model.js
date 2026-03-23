// models/seat.model.js
import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    branch: {
      type: String,
      enum: ["CSE", "AE", "ChE", "CE", "ECE", "EEE", "ME", "Poly"],
      required: true,
      unique: true,
      index: true,
    },

    // NORMAL ADMISSION
    normalTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    normalAvailable: {
      type: Number,
      default: 0,
      min: 0,
    },

    // LATERAL ADMISSION
    lateralTotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    lateralAvailable: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Safety check
seatSchema.pre("save", function (next) {
  if (this.normalAvailable > this.normalTotal)
    this.normalAvailable = this.normalTotal;

  if (this.lateralAvailable > this.lateralTotal)
    this.lateralAvailable = this.lateralTotal;

  if (this.normalAvailable < 0) this.normalAvailable = 0;
  if (this.lateralAvailable < 0) this.lateralAvailable = 0;

  next();
});

export default mongoose.model("Seat", seatSchema);