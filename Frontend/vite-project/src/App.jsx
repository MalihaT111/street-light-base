import {Routes, Route} from "react-router-dom";
import Login from "./pages/LoginAndRegister/Login.js";
import Register from "./pages/LoginAndRegister/Register.js";

function App() {

  return (
    <>
      <Routes>
        <Route path = "/" element = {<Login />} />
        <Route path = "/register" element = {<Register />} />
      </Routes>
    </>
  )
}

export default App
