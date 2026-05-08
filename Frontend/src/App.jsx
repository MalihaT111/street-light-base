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
import GeoExport from "./pages/GeoExport/GeoExport.jsx";
import Settings from "./pages/Settings/Settings.jsx";
import Challenge from "./pages/Challenge/Challenge.jsx";
import Mission from "./pages/Mission/Missinon.jsx";
import ForgotPassword from "./pages/LoginAndRegister/ForgetPassword.jsx";
import ResetPassword from "./pages/LoginAndRegister/ResetPassword.jsx";
import VerifyEmail from "./pages/LoginAndRegister/VerifyEmail.jsx";
import Cookies from 'js-cookie';

function getRole() {
  try {
    const savedUser = Cookies.get("user");
    const role = savedUser ? JSON.parse(savedUser).role || "" : "";
    return ["admin", "dot_admin", "ppl"].includes(String(role).trim().toLowerCase()) ? "admin" : role;
  } catch {
    return "";
  }
}

function DotAdminRoute({ children }) {
  const token = Cookies.get("token");
  if (!token) return <Navigate to="/" replace />;
  if (getRole() !== "admin") return <Navigate to="/home" replace />;
  return children;
}

function CitizenRoute({ children }) {
  const token = Cookies.get("token");
  // console.log('CitizenRoute token:', token);
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
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/home" element={<CitizenRoute><Home /></CitizenRoute>} />
        <Route path="/leaderboard" element={<CitizenRoute><Leaderboard /></CitizenRoute>} />
        <Route path="/reports" element={<CitizenRoute><Reports /></CitizenRoute>} />
        <Route path="/manage-reports" element={<CitizenRoute><ManageReports /></CitizenRoute>} />
        <Route path="/progress" element={<CitizenRoute><Progress /></CitizenRoute>} />
        <Route path="/challenge" element={<CitizenRoute><Challenge /></CitizenRoute>} />
        <Route path="/mission" element={<CitizenRoute><Mission /></CitizenRoute>} />
        <Route path="/settings" element={<CitizenRoute><Settings /></CitizenRoute>} />
        <Route path="/dashboard" element={<DotAdminRoute><Dashboard /></DotAdminRoute>} />
        <Route path="/all-reports" element={<DotAdminRoute><AllReports /></DotAdminRoute>} />
        <Route path="/export" element={<DotAdminRoute><GeoExport /></DotAdminRoute>} />
      </Routes>
    </>
  )
}

export default App
