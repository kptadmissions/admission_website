import Application from "../models/Application.js";
import Counter from "../models/Counter.js";

export const generateApplicationNumber = async (shiftType, category) => {

  // ✅ YEAR
  const year = new Date().getFullYear().toString().slice(-2);

  // ✅ CATEGORY NORMALIZATION
  const normalizeCategory = (cat) => {
    if (!cat) return "GM";

    const value = cat.toUpperCase().trim();

    if (value.startsWith("SC")) return "SC";

    if (value === "ST") return "ST";

    if (
      value === "CAT-1" ||
      value === "CAT1" ||
      value === "C-1"
    ) {
      return "C-1";
    }

    return "GM";
  };

  const normalizedCategory = normalizeCategory(category);

  // ✅ RESERVED CHECK
  const isReserved = ["SC", "ST", "C-1"].includes(normalizedCategory);

  // ✅ CATEGORY PREFIX
  const categoryPrefix = isReserved ? "C" : "G";

  // ✅ SHIFT CODE
  const shiftCode =
    shiftType === "Day Shift"
      ? "103"
      : "186";

  // ✅ COMMON GLOBAL COUNTER
  const counterId = `APP${year}`;

  // ✅ CREATE / INCREMENT COUNTER
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    {
      $inc: { seq: 1 }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  // ✅ SERIAL
  const serial = counter.seq.toString().padStart(4, "0");

  // ✅ FINAL APPLICATION NUMBER
  const applicationNumber =
    `${categoryPrefix}${shiftCode}${year}${serial}`;

  return applicationNumber;
};