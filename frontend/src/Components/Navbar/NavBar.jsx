import './NavBar.css'
import logo from "../../assets/logo.png"
const NavBar = () =>{

    return (

        <nav className="navbar">
            <div className="navbar__inner">
                <div className="navbar__left">
                    <a className="navbar__left-img" href="/"><img src={logo} alt=""/></a>
                    <a className="navbar__brand" href="/">LAST KINO</a>
                </div>

                <div className="navbar__middle">


                    <ul className="navbar__menu">
                        <li><a className="is-active" href="#">Repertuar</a></li>
                        <li><a href="#">Nowości</a></li>
                        <li><a href="#">Promocje</a></li>
                    </ul>
                </div>

                <div className="navbar__right">
                    <div className="navbar__login">
                        <button>Zaloguj się</button>
                        <button>Stwórz konto</button>
                    </div>
                </div>
            </div>
        </nav>
    )

}

export default NavBar