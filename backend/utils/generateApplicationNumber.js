import Application from "../models/Application.js";

export const generateApplicationNumber = async (shiftType, category) => {
  const year = new Date().getFullYear();

  const isReserved = ["SC", "ST", "C-1"].includes(category);

  let prefix = "";

  if (shiftType === "Day Shift") {
    prefix = isReserved ? "C103" : "G103";
  } else {
    prefix = isReserved ? "C186" : "G186";
  }

  const regex = new RegExp(`^${prefix}${year}`);

  const count = await Application.countDocuments({
    applicationNumber: { $regex: regex }
  });

  const serial = (count + 1).toString().padStart(4, "0");

  const applicationNumber = `${prefix}${year}${serial}`;

  return applicationNumber;
};