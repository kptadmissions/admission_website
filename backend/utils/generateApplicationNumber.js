import Application from "../models/Application.js";

export const generateApplicationNumber = async (shiftType, category) => {
  // ✅ Get last 2 digits of year
  const fullYear = new Date().getFullYear();
  const shortYear = fullYear.toString().slice(-2); // "26"

  // 🔹 NORMALIZE CATEGORY
  const normalizeCategory = (cat) => {
    if (!cat) return "GM";

    if (cat.includes("SC")) return "SC";
    if (cat === "ST") return "ST";
    if (cat === "Cat-1") return "C-1";

    return "GM";
  };

  const normalizedCategory = normalizeCategory(category);

  // 🔹 USE NORMALIZED VALUE
  const isReserved = ["SC", "ST", "C-1"].includes(normalizedCategory);

  let prefix = "";

  if (shiftType === "Day Shift") {
    prefix = isReserved ? "C103" : "G103";
  } else {
    prefix = isReserved ? "C186" : "G186";
  }

  // 🔹 COUNT EXISTING
  const regex = new RegExp(`^${prefix}${shortYear}`);

  const count = await Application.countDocuments({
    applicationNumber: { $regex: regex }
  });

  const serial = (count + 1).toString().padStart(4, "0");

  // 🔹 FINAL NUMBER
  const applicationNumber = `${prefix}${shortYear}${serial}`;

  return applicationNumber;
};