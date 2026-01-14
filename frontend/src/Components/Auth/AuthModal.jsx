//komponent obslugujacy wyswietlanie formularza od logowania lub rejestracji w zaleznosci od stanu

import {useAuthUI} from '../../context/authUIContext.jsx'
import LoginForm from "./LoginForm/LoginForm.jsx";
import RegisterForm from "./RegisterForm/RegisterForm.jsx";

const AuthModal = () =>{

    const {authFormOpen,authFormMode} = useAuthUI()

    if (!authFormOpen) return null

    return authFormMode === 'login' ? <LoginForm/> : <RegisterForm/>

}

export default AuthModal