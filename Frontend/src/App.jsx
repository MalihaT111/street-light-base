import {Routes, Route} from "react-router-dom";
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

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard/>} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/manage-reports" element ={<ManageReports/>}/>
        <Route path="/progress" element={<Progress/>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/all-reports" element={<AllReports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  )
}

export default App
