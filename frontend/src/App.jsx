import {Outlet} from "react-router-dom"
import './App.css'
import NavBar from "./Components/Navbar/NavBar.jsx";
import Footer from "./Components/Footer/Footer.jsx";
import AuthModal from "./Components/Auth/AuthModal.jsx";
import {AuthUIProvider} from "./context/authUIContext.jsx";

function App() {

  return (
    <div className="app-container">
        <AuthUIProvider>
            <NavBar/>
            <Outlet/>
            <Footer/>
            <AuthModal/>
        </AuthUIProvider>

    </div>
  )
}

export default App
