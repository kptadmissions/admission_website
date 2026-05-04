import Application from "../models/Application.js";
import Counter from "../models/Counter.js";

export const generateApplicationNumber = async (shiftType, category) => {
  const year = new Date().getFullYear().toString().slice(-2);

  const normalizeCategory = (cat) => {
  if (!cat) return "GM";

  const value = cat.toUpperCase().trim();

  if (value.startsWith("SC")) return "SC";
  if (value === "ST") return "ST";
  if (value === "CAT-1") return "C-1";

  return "GM";
};

  const normalizedCategory = normalizeCategory(category);
  const isReserved = ["SC", "ST", "C-1"].includes(normalizedCategory);

  let prefix = "";

  if (shiftType === "Day Shift") {
    prefix = isReserved ? "C103" : "G103";
  } else {
    prefix = isReserved ? "C186" : "G186";
  }

  const counterId = `${prefix}${year}`;

  // 🔥 ATOMIC INCREMENT (IMPORTANT)
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const serial = counter.seq.toString().padStart(4, "0");

  return `${prefix}${year}${serial}`;
};