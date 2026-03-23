import Seat from "../models/seat.model.js";

/* GET ALL SEATS */
export const getAllSeats = async (req, res) => {
  try {
    const seats = await Seat.find().sort({ branch: 1 });
    res.json({ seats });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch seats" });
  }
};

/* CREATE / UPDATE SEATS */
export const upsertSeat = async (req, res) => {
  try {
    const { branch, normalTotal, lateralTotal } = req.body;

    if (!branch) {
      return res.status(400).json({ message: "Branch required" });
    }

    let seat = await Seat.findOne({ branch });

    if (!seat) {
      // Create new
      seat = await Seat.create({
        branch,
        normalTotal,
        normalAvailable: normalTotal,
        lateralTotal,
        lateralAvailable: lateralTotal,
      });
    } else {
      // Update existing
      const normalDiff = normalTotal - seat.normalTotal;
      const lateralDiff = lateralTotal - seat.lateralTotal;

      seat.normalTotal = normalTotal;
      seat.lateralTotal = lateralTotal;

      if (normalDiff > 0) seat.normalAvailable += normalDiff;
      if (lateralDiff > 0) seat.lateralAvailable += lateralDiff;

      await seat.save();
    }

    res.json({ success: true, seat });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update seat data" });
  }
};