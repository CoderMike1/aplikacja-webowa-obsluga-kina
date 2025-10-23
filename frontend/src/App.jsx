import {Outlet} from "react-router-dom"
import './App.css'
import NavBar from "./Components/Navbar/NavBar.jsx";
import Footer from "./Components/Footer/Footer.jsx";

function App() {

  return (
    <div className="app-container">
        <NavBar/>
        <Outlet/>
        <Footer/>
    </div>
  )
}

export default App
