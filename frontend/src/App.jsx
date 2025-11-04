import {Outlet} from "react-router-dom"
import './App.css'
import NavBar from "./Components/Navbar/NavBar.jsx";
import Footer from "./Components/Footer/Footer.jsx";
import AuthModal from "./Components/Auth/AuthModal.jsx";
import {AuthUIProvider} from "./context/authUIContext.jsx";
import {AuthProvider} from "./context/Auth.jsx";

function App() {

  return (
    <div className="app-container">
        <AuthProvider>
            <AuthUIProvider>
                <NavBar/>
                <Outlet/>
                <Footer/>
                <AuthModal/>
            </AuthUIProvider>
        </AuthProvider>
    </div>
  )
}

export default App
