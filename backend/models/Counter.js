import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: String, // e.g. APP26
  seq: {
    type: Number,
    default: 2000
  }
});

export default mongoose.model("Counter", counterSchema);