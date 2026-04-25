import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import axios from "axios";
import logo from "/logo.jpg";

export default function StudentNavbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const [admission, setAdmission] = useState(null);
  const [exam, setExam] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [admissionRes, examRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/admission/settings`),
          axios.get(`${import.meta.env.VITE_API_URL}/exam/settings`)
        ]);

        setAdmission(admissionRes.data);
        setExam(examRes.data);

      } catch {
        console.error("Failed to load settings");
      }
    };

    fetchData();
  }, []);

  const active = (path) =>
    pathname.startsWith(path)
      ? "text-indigo-600 font-bold"
      : "text-gray-700 hover:text-indigo-500";

  const admissionsOpen = admission?.normalActive || admission?.lateralActive;
  const examOpen = exam?.isExamOpen;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">

        <Link to="/student">
          <img src={logo} alt="Logo" className="h-8 sm:h-9 w-auto" />
        </Link>

        {/* ===== DESKTOP ===== */}
        <div className="hidden sm:flex gap-6 items-center">
          <Link to="/student" className={active("/student")}>
            Dashboard
          </Link>

          {admissionsOpen && (
            <Link to="/student/application" className={active("/student/application")}>
              Application Form
            </Link>
          )}

          {/* 🔥 NEW: EXAM */}
          {examOpen && (
            <Link to="/student/exam" className={active("/student/exam")}>
              Entrance Test
            </Link>
          )}

          <UserButton afterSignOutUrl="/" />
        </div>

        {/* MOBILE */}
        <button className="sm:hidden" onClick={() => setOpen(!open)}>
          ☰
        </button>
      </div>

      {open && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-3">

          <Link to="/student" onClick={() => setOpen(false)}>
            Dashboard
          </Link>

          {admissionsOpen && (
            <Link to="/student/application" onClick={() => setOpen(false)}>
              Application Form
            </Link>
          )}

          {examOpen && (
            <Link to="/student/exam" onClick={() => setOpen(false)}>
              Entrance Test
            </Link>
          )}

          <UserButton afterSignOutUrl="/" />
        </div>
      )}
    </nav>
  );
}