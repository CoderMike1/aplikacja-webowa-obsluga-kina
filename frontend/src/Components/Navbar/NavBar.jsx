import './NavBar.css'
import logo from "../../assets/logo.png"
const NavBar = () =>{

    return (

        <nav className="navbar">
            <div className="navbar__left">
                <div className="navbar__left-img">
                    <img src={logo} alt="logo"/>
                </div>
                <div className="navbar__left-text">
                    <h4>LAST KINO</h4>
                </div>
            </div>
            <div className="navbar__middle">
                <ul className="navbar__menu">
                    <li>Repertuar</li>
                    <li>Nowości</li>
                    <li>Promocje</li>
                </ul>
            </div>
            <div className="navbar__right">
                right
            </div>
        </nav>
    )

}

export default NavBar