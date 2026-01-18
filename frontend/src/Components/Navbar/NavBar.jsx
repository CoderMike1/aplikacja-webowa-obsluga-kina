//komponent menu bar

import './NavBar.css'
import { useAuthUI } from "../../context/authUIContext.jsx";
import { useAuthContext } from "../../context/Auth.jsx";
import { NavLink, useNavigate } from "react-router-dom";
import logoutIcon from "../../assets/logout.png";
const NavBar = () => {

    const { showLoginForm, showRegisterForm } = useAuthUI();

    const { isLoggedIn, user, logout } = useAuthContext()
    const navigate = useNavigate();


    return (

        <nav className="navbar">
            <div className="navbar__inner">
                <div className="navbar__left">
                    <a className="navbar__left-img" href="/"><img src="/logo.png" alt="" /></a>
                    <a className="navbar__brand" href="/">LAST KINO</a>
                </div>

                <div className="navbar__middle">
                    <ul className="navbar__menu">
                        <li>
                            <NavLink
                                to='/repertuar'
                                className={({ isActive }) => (isActive ? "is-active" : "")}
                            >
                                Repertuar
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to='/nowosci'
                                className={({ isActive }) => (isActive ? "is-active" : "")}
                            >
                                Nowości
                            </NavLink>
                        </li>
                        <li>
                            <NavLink
                                to='/promocje'
                                className={({ isActive }) => (isActive ? "is-active" : "")}
                            >
                                Promocje
                            </NavLink>
                        </li>
                    </ul>
                </div>

                <div className="navbar__right">
                    {isLoggedIn ? (
                        <div className="navbar__my_account" style={{ display: 'flex', gap: '0px', alignItems: 'center' }}>
                            <div className="navbar__my_account_button" style={{ display: 'flex', gap: '0px' }}>
                                {user?.is_staff ? (
                                    <li style={{ listStyle:'none' }}>
                                        <NavLink
                                            to='/panel-pracownika'
                                            className={({ isActive }) => (isActive ? "is-active" : "")}
                                        >
                                            <button>Panel pracownika</button>

                                        </NavLink>
                                    </li>
                                )
                                :
                                    <li style={{ listStyle:'none' }}>
                                        <NavLink
                                            to="/profil"
                                            className={({ isActive }) =>
                                                isActive ? "is-active" : ""
                                            }
                                        >
                                            <button>Moje konto</button>
                                        </NavLink>
                                    </li>

                                }

                            </div>

                            <div className="navbar__logout">
                                <button onClick={() => { logout(); navigate('/'); }} title="Wyloguj">
                                    <img src={logoutIcon} alt="Wyloguj" style={{ width: 20, height: 20 }} />
                                </button></div>
                        </div>


                    ) : (
                        <div className="navbar__login">
                            <button onClick={() => showLoginForm()}>Zaloguj się</button>
                            <button onClick={() => showRegisterForm()}>Stwórz konto</button>
                        </div>
                    )}

                </div>
            </div>
        </nav>
    )

}

export default NavBar