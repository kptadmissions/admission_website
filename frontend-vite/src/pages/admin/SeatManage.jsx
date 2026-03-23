import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { Layers, Save } from "lucide-react";
import { motion } from "framer-motion";

/* SINGLE SOURCE OF TRUTH */
const BRANCHES = [
  { code: "CSE", label: "Computer Science & Engineering" },
  { code: "AE", label: "Automobile Engineering" },
  { code: "ChE", label: "Chemical Engineering" },
  { code: "CE", label: "Civil Engineering" },
  { code: "ECE", label: "Electronics & Communication Engineering" },
  { code: "EEE", label: "Electrical & Electronics Engineering" },
  { code: "ME", label: "Mechanical Engineering" },
  { code: "Poly", label: "Polymer Technology" },
];

export default function SeatManagement() {
  const { getToken } = useAuth();

  const [seats, setSeats] = useState({});
  const [inputs, setInputs] = useState({});
  const [loading, setLoading] = useState(true);

  /* FETCH SEATS */
  const fetchSeats = async () => {
    try {
      const token = await getToken();

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/seats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const seatMap = {};
      const inputMap = {};

      res.data.seats.forEach((s) => {
        seatMap[s.branch] = s;

        inputMap[s.branch] = {
          normalTotal: s.normalTotal || 0,
          lateralTotal: s.lateralTotal || 0,
        };
      });

      setSeats(seatMap);
      setInputs(inputMap);
      setLoading(false);
    } catch (err) {
      toast.error("Failed to load seats");
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  /* SAVE SEATS */
  const save = async (branch) => {
    try {
      const token = await getToken();

      await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/seats`,
        {
          branch,
          normalTotal: Number(inputs[branch].normalTotal),
          lateralTotal: Number(inputs[branch].lateralTotal),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`${branch} seats updated`);
      fetchSeats();
    } catch {
      toast.error("Failed to update seats");
    }
  };

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Loading seats...
      </div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-6 py-10"
    >
      {/* HEADER */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-3xl font-bold mb-10 flex items-center gap-3 text-indigo-700"
      >
        <motion.span
          animate={{ rotate: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 4 }}
        >
          <Layers className="w-7 h-7" />
        </motion.span>
        Seat Management
      </motion.h1>

      {/* CARDS */}
      <div className="space-y-5">
        {BRANCHES.map((b, i) => (
          <motion.div
            key={b.code}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.02 }}
            className="bg-white/80 backdrop-blur border rounded-2xl p-6 shadow hover:shadow-xl transition"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

              {/* LEFT SIDE INFO */}
              <div>
                <p className="font-semibold text-lg text-gray-800">
                  {b.label}
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Normal Available:
                  <span className="ml-2 font-bold text-indigo-600">
                    {seats[b.code]?.normalAvailable ?? 0}
                  </span>
                </p>

                <p className="text-sm text-gray-500">
                  Lateral Available:
                  <span className="ml-2 font-bold text-indigo-600">
                    {seats[b.code]?.lateralAvailable ?? 0}
                  </span>
                </p>
              </div>

              {/* INPUTS */}
              <div className="flex items-end gap-4">

                {/* NORMAL INPUT */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">
                    Normal Seats
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inputs[b.code]?.normalTotal ?? ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [b.code]: {
                          ...inputs[b.code],
                          normalTotal: e.target.value,
                        },
                      })
                    }
                    className="border rounded-xl px-4 py-2 w-28 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                  />
                </div>

                {/* LATERAL INPUT */}
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 mb-1">
                    Lateral Seats
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inputs[b.code]?.lateralTotal ?? ""}
                    onChange={(e) =>
                      setInputs({
                        ...inputs,
                        [b.code]: {
                          ...inputs[b.code],
                          lateralTotal: e.target.value,
                        },
                      })
                    }
                    className="border rounded-xl px-4 py-2 w-28 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50"
                  />
                </div>

                {/* SAVE BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => save(b.code)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl flex items-center gap-2 shadow"
                >
                  <Save className="w-4 h-4" />
                  Save
                </motion.button>

              </div>

            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}