import { Routes, Route } from "react-router-dom";

import RoleBasedNavbar from "./navbars/RoleBasedNavbar";
import DashboardRedirect from "./components/DashboardRedirect";

import Landing from "./pages/Landing";
import Unauthorized from "./pages/Unauthorized";


import RequireRole from "./auth/RequireRole";

// ================= ADMIN =================
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/manage-users";
import CreateUser from "./pages/admin/SeatManage";
import AdminAdmissionControl from "./pages/admin/AdminAdmissionControl";
import ExamQuestion from "./pages/admin/ExamQuestions";
import ExamControl from "./pages/admin/ExamControl";
// ================= STUDENT =================
import StudentDashboard from "./pages/student/StudentDashboard";
import AdmissionForm from "./pages/student/AdmissionForm";
import ExamPage from "./pages/student/ExamPage";

// ================= VERIFICATION =================
import VerifyApplications from "./pages/verification/VerifyApplications";
import GenerateMerit from "./pages/verification/GenerateMerit";
import FinalApproval from "./pages/verification/FinalApproval";
import MeritList from "./pages/verification/MeritList";
import SeatAllocation from "./pages/verification/SeatAllocation";
import OfficerDashboard from "./pages/verification/OfficerDashboard";

// GLOBAL SHELL
import AppShell from "./layout/AppShell";

export default function App() {
  return (
    <AppShell>

      <RoleBasedNavbar />

      <Routes>
        {/* ===== PUBLIC ===== */}
        <Route path="/" element={<Landing />} />
        <Route path="/redirect" element={<DashboardRedirect />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ===== ADMIN ===== */}
        <Route
          path="/admin"
          element={
            <RequireRole allowedRoles={["admin"]}>
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="s-manage" element={<CreateUser />} />
          <Route path="admission-control" element={<AdminAdmissionControl />} />
          <Route path="exam-questions" element={<ExamQuestion />} />
<Route path="exam-control" element={<ExamControl />} />
        </Route>

        {/* ===== STUDENT ===== */}
        <Route
          path="/student"
          element={
            <RequireRole allowedRoles={["student"]}>
              <StudentDashboard />
            </RequireRole>
          }
        />

        <Route
          path="/student/application"
          element={
            <RequireRole allowedRoles={["student"]}>
              <AdmissionForm />
            </RequireRole>
          }
        />
        <Route
          path="/student/exam"
          element={
            <RequireRole allowedRoles={["student"]}>
              <ExamPage />
            </RequireRole>
          }
        />

        {/* ===== VERIFICATION OFFICER ===== */}
        <Route
          path="/verification"
          element={
            <RequireRole allowedRoles={["verification_officer"]}>
              <VerifyApplications />
            </RequireRole>
          }
        />

        

        <Route
          path="/verification/merit"
          element={
            <RequireRole allowedRoles={["verification_officer"]}>
              <GenerateMerit />
            </RequireRole>
          }
        />

        <Route
          path="/verification/final"
          element={
            <RequireRole allowedRoles={["verification_officer"]}>
              <FinalApproval />
            </RequireRole>
          }
        />

        <Route
          path="/verification/merit-list"
          element={
            <RequireRole allowedRoles={["verification_officer"]}>
              <MeritList />
            </RequireRole>
          }
        />

        <Route
          path="/verification/seat-allocation"
          element={
            <RequireRole allowedRoles={["verification_officer"]}>
              <SeatAllocation />
            </RequireRole>
          }
        />

        <Route
          path="/verification/dashboard"
          element={
            <RequireRole allowedRoles={["verification_officer"]}>
              <OfficerDashboard />
            </RequireRole>
          }
        />
      </Routes>

    </AppShell>
  );
}