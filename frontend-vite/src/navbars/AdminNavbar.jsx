import { Link, useLocation } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import logo from "/logo.jpg";

export default function AdminNavbar() {
  const { pathname } = useLocation();

  const active = (path) =>
    pathname.startsWith(path)
      ? "text-indigo-600 font-semibold"
      : "text-gray-700 hover:text-indigo-500";

  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="px-6 py-3 flex justify-between items-center">
        
        {/* LOGO */}
        <Link to="/admin" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-9 w-auto" />
        </Link>

        <div className="flex gap-6 items-center">
          <Link to="/admin" className={active("/admin")}>Dashboard</Link>
          <Link to="/admin/manage-users" className={active("/admin/manage-users")}>
            Manage Users
          </Link>
          <Link to="/admin/s-manage" className={active("/admin/s-manage")}>
            Seat Management
          </Link>
          <Link to="/admin/admission-control">Admission Control</Link>
          <Link to="/admin/exam-questions">Exam Questions</Link>
          <Link to="/admin/exam-control">Exam Control</Link>

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </nav>
  );
}
