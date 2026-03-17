import {Routes, Route} from "react-router-dom";
import Login from "./pages/LoginAndRegister/Login.jsx";
import Register from "./pages/LoginAndRegister/Register.jsx";
import Home from "./pages/Home/Home.jsx";
import Leaderboard from "./pages/Leaderboard/Leaderboard.jsx";
import Reports from "./pages/Reports/Reports.jsx";
import Challenge from "./pages/Challenge/Challenge.jsx";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard/>} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/challenge" element={<Challenge/>} />
      </Routes>
    </>
  )
}

export default App
