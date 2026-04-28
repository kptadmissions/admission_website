// path: frontend-vite/src/navbars/VerificationNavbar.jsx
import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import logo from "/logo.jpg";

export default function VerificationNavbar() {
  const { pathname } = useLocation();

  const active = (path) =>
    pathname.startsWith(path)
      ? "text-indigo-600 font-semibold"
      : "text-gray-700 hover:text-indigo-500";

  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="px-6 py-3 flex justify-between items-center">
        
        <Link to="/verification/dashboard">
          <img src={logo} alt="Logo" className="h-9 w-auto" />
        </Link>

        <div className="flex gap-6 items-center">
          
          <Link to="/verification/dashboard" className={active("/verification/dashboard")}>
            Dashboard
          </Link>

          <Link to="/verification/applicationform" className={active("/verification/applicationform")}>
            Application Form
          </Link>

          {/* ✅ FIXED HERE */}
          <Link to="/verification/update" className={active("/verification/update")}>
            Update Application
          </Link>

          <Link to="/verification/acknowledgement" className={active("/verification/acknowledgement")}>
            Acknowledgement
          </Link>

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}