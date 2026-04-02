import {Routes, Route} from "react-router-dom";
import Login from "./pages/LoginAndRegister/Login.jsx";
import Register from "./pages/LoginAndRegister/Register.jsx";
import Home from "./pages/Home/Home.jsx";
import Leaderboard from "./pages/Leaderboard/Leaderboard.jsx";
import Reports from "./pages/Reports/Reports.jsx";
import ManageReports from "./pages/Reports/ManageReports.jsx";
import Challenge from "./pages/Challenge/Challenge.jsx";
import Dashboard from "./pages/DOT/DOT-dashboard/Dashboard.jsx";
import AllReports from "./pages/DOT/AllReports/AllReports.jsx";

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
        <Route path="/challenge" element={<Challenge/>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/all-reports" element={<AllReports />} />
      </Routes>
    </>
  )
}

export default App
