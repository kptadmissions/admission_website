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
        
        <Link to="/verification">
          <img src={logo} alt="Logo" className="h-9 w-auto" />
        </Link>

        <div className="flex gap-6 items-center">
         <Link to="/verification/dashboard" className={active("/verification/dashboard")}>
            Dashboard
          </Link>
          <Link to="/verification" className={active("/verification")}>
            Verify Applications
          </Link>
          <Link to="/verification/merit" className={active("/verification/merit")}>
            Generate Merit
          </Link>
          <Link
            to="/verification/seat-allocation"
            className={active("/verification/seat-allocation")}
          >
            Seat Allocation
          </Link>
          <Link to="/verification/final" className={active("/verification/final")}>
            Final Approval
          </Link>

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
