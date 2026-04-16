import {Routes, Route, Navigate} from "react-router-dom";
import Login from "./pages/LoginAndRegister/Login.jsx";
import Register from "./pages/LoginAndRegister/Register.jsx";
import Home from "./pages/Home/Home.jsx";
import Leaderboard from "./pages/Leaderboard/Leaderboard.jsx";
import Reports from "./pages/Reports/Reports.jsx";
import ManageReports from "./pages/Reports/ManageReports.jsx";
import Progress from "./pages/Progress/Progress.jsx";
import Dashboard from "./pages/DOT-dashboard/Dashboard.jsx";
import AllReports from "./pages/AllReports/AllReports.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import ForgotPassword from "./pages/LoginAndRegister/ForgetPassword.jsx";
import ResetPassword from "./pages/LoginAndRegister/ResetPassword.jsx";
// Testing
import ToolTipTest from "./pages/Reports/components/ToolTipTest.jsx";

function getRole() {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}").role || "";
  } catch {
    return "";
  }
}

function DotAdminRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  if (getRole() !== "admin") return <Navigate to="/home" replace />;
  return children;
}

function CitizenRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  if (getRole() === "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<CitizenRoute><Home /></CitizenRoute>} />
        <Route path="/leaderboard" element={<CitizenRoute><Leaderboard /></CitizenRoute>} />
        <Route path="/reports" element={<CitizenRoute><Reports /></CitizenRoute>} />
        <Route path="/manage-reports" element={<CitizenRoute><ManageReports /></CitizenRoute>} />
        <Route path="/progress" element={<CitizenRoute><Progress /></CitizenRoute>} />
        <Route path="/settings" element={<CitizenRoute><Settings /></CitizenRoute>} />
        <Route path="/dashboard" element={<DotAdminRoute><Dashboard /></DotAdminRoute>} />
        <Route path="/all-reports" element={<DotAdminRoute><AllReports /></DotAdminRoute>} />
        {/* testing */}
        <Route path="/tooltip-test" element={<ToolTipTest />} />
      </Routes>
    </>
  )
}

export default App
