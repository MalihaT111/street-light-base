import {Routes, Route} from "react-router-dom";
import Login from "./pages/LoginAndRegister/Login.jsx";
import Register from "./pages/LoginAndRegister/Register.jsx";
import Home from "./pages/Home/Home.jsx";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </>
  )
}

export default App
