import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export default function AdminAdmissionControl() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/admission/settings`
        );
        setSettings(res.data);
      } catch {
        toast.error("Failed to load admission settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggle = async (field) => {
    try {
      setUpdating(true);
      const token = await getToken();

      let payload = {};

      if (field === "normalActive") {
        payload = {
          normalActive: !settings.normalActive,
          lateralActive: false,
        };
      }

      if (field === "lateralActive") {
        payload = {
          lateralActive: !settings.lateralActive,
          normalActive: false,
        };
      }

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/admission/settings`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSettings(res.data);
      toast.success("Admission settings updated");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-5xl mx-auto px-6 py-10"
    >
      {/* HEADER */}
      <div className="flex items-center gap-3 text-indigo-700 text-3xl font-bold mb-10">
        <Settings className="w-7 h-7" />
        Admission Control
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* SKELETON LOADING */}
        {loading &&
          [1, 2].map((i) => (
            <div
              key={i}
              className="bg-gray-100 rounded-2xl p-8 animate-pulse"
            >
              <div className="h-6 w-40 bg-gray-300 rounded mb-4" />
              <div className="h-4 w-56 bg-gray-300 rounded mb-6" />
              <div className="h-12 w-full bg-gray-300 rounded-xl" />
            </div>
          ))}

        {/* REAL CONTENT */}
        {!loading && (
          <>
            {/* NORMAL */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8 border"
            >
              <h2 className="text-xl font-semibold mb-1">
                Normal Admission
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                First Year / Regular Admission
              </p>

              <button
                disabled={updating}
                onClick={() => toggle("normalActive")}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200
                  ${
                    settings.normalActive
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                  ${updating && "opacity-70 cursor-not-allowed"}
                `}
              >
                {settings.normalActive ? "ADMISSION OPEN" : "ADMISSION CLOSED"}
              </button>
            </motion.div>

            {/* LATERAL */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8 border"
            >
              <h2 className="text-xl font-semibold mb-1">
                Lateral Entry
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                ITI / PUC Direct Second Year
              </p>

              <button
                disabled={updating}
                onClick={() => toggle("lateralActive")}
                className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200
                  ${
                    settings.lateralActive
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }
                  ${updating && "opacity-70 cursor-not-allowed"}
                `}
              >
                {settings.lateralActive
                  ? "ADMISSION OPEN"
                  : "ADMISSION CLOSED"}
              </button>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}