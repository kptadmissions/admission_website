import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Settings } from "lucide-react";

export default function ExamControl() {
  const { getToken } = useAuth();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/exam/settings`
        );
        setSettings(res.data);
      } catch {
        toast.error("Failed to load exam settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateSettings = async (newData) => {
    try {
      setUpdating(true);
      const token = await getToken();

      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/exam/settings`,
        newData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSettings(res.data);
      toast.success("Exam settings updated");
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <p className="text-center mt-10">Loading...</p>;

  return (
    <motion.div
      className="max-w-5xl mx-auto px-6 py-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 text-indigo-700 text-3xl font-bold mb-10">
        <Settings className="w-7 h-7" />
        Entrance Exam Control
      </div>

      <div className="grid md:grid-cols-2 gap-8">

        {/* EXAM TOGGLE */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-2">
            Exam Status
          </h2>

          <button
            disabled={updating}
            onClick={() =>
              updateSettings({ isExamOpen: !settings.isExamOpen })
            }
            className={`w-full py-4 rounded-xl font-semibold text-white ${
              settings.isExamOpen
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {settings.isExamOpen ? "EXAM OPEN" : "EXAM CLOSED"}
          </button>
        </div>

        {/* EXAM CONFIG */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border">
          <h2 className="text-xl font-semibold mb-4">
            Exam Configuration
          </h2>

          <div className="flex flex-col gap-4">

            <input
              type="number"
              value={settings.duration}
              onChange={(e) =>
                setSettings({ ...settings, duration: e.target.value })
              }
              placeholder="Duration (minutes)"
              className="border p-3 rounded"
            />

            <input
              type="number"
              value={settings.totalQuestions}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  totalQuestions: e.target.value
                })
              }
              placeholder="Total Questions"
              className="border p-3 rounded"
            />

            <button
              onClick={() =>
                updateSettings({
                  duration: settings.duration,
                  totalQuestions: settings.totalQuestions
                })
              }
              className="bg-indigo-600 text-white py-3 rounded-lg"
            >
              Save Settings
            </button>

          </div>
        </div>

      </div>
    </motion.div>
  );
}