import './NavBar.css'
import logo from "../../assets/logo.png"
import { useAuthUI } from "../../context/authUIContext.jsx";
import { useAuthContext } from "../../context/Auth.jsx";
import { NavLink } from "react-router-dom";
const NavBar = () => {

    const { showLoginForm, showRegisterForm } = useAuthUI();

    const { isLoggedIn } = useAuthContext()


    return (

        <nav className="navbar">
            <div className="navbar__inner">
                <div className="navbar__left">
                    <a className="navbar__left-img" href="/"><img src={logo} alt="" /></a>
                    <a className="navbar__brand" href="/">LAST KINO</a>
                </div>

                <div className="navbar__middle">
                    <ul className="navbar__menu">
                        {/*className="is-active"*/}
                        <li>
                            <NavLink
                                to='/repertuar'
                                className={({ isActive }) =>
                                    isActive ? "is-active" : ""
                                }
                            >
                                Repertuar
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to='/nowosci'
                                className={({ isActive }) =>
                                    isActive ? "is-active" : ""
                                }
                            >
                                Nowości
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to='/promocje'
                                className={({ isActive }) =>
                                    isActive ? "is-active" : ""
                                }
                            >
                                Promocje
                            </NavLink>
                        </li>
                    </ul>
                </div>

                <div className="navbar__right">
                    {isLoggedIn ?
                        <div className="navbar__my_account">
                                <NavLink 
                                to="/profil"
                                className={({ isActive }) =>
                                    isActive ? "is-active" : ""
                                }    
                                    >
                                    <button>Moje konto</button>
                                    </NavLink>
                        </div>

                        :
                        <div className="navbar__login">
                            <button onClick={() => showLoginForm()}>Zaloguj się</button>
                            <button onClick={() => showRegisterForm()}>Stwórz konto</button>
                        </div>
                    }

                </div>
            </div>
        </nav>
    )

}

export default NavBar