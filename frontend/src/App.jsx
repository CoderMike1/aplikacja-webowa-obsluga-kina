//glowny core aplikacji , dodane contexty

import {Outlet} from "react-router-dom"
import './App.css'
import NavBar from "./Components/Navbar/NavBar.jsx";
import Footer from "./Components/Footer/Footer.jsx";
import AuthModal from "./Components/Auth/AuthModal.jsx";
import {AuthUIProvider} from "./context/authUIContext.jsx";
import {AuthProvider} from "./context/Auth.jsx";
import ScrollToTop from "./Components/Layout/ScrollToTop.jsx";
import {CheckoutProvider} from "./context/CheckoutContext.jsx";

function App() {

  return (
    <div className="app-container">
        <ScrollToTop/>
        <CheckoutProvider>
        <AuthProvider>
            <AuthUIProvider>
                <NavBar/>
                <Outlet/>
                <Footer/>
                <AuthModal/>
            </AuthUIProvider>
        </AuthProvider>
        </CheckoutProvider>
    </div>
  )
}

export default App
