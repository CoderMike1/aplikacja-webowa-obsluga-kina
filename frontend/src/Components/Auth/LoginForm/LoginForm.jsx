import {useState} from "react";
import {useAuthUI} from "../../../context/authUIContext.jsx";

import '../Forms.css'
const LoginForm = () =>{
    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")

    const [errorMessage,setErrorMessage] = useState("")

    const {closeForm,showRegisterForm} = useAuthUI()

    const handleLogin = (e) =>{
        e.preventDefault()
    }


    return (
        <div className="login_form__container">

            <form onSubmit={handleLogin}>
                <h3 className="login_form__header">Logowanie</h3>
                <h5 className="login_form__err_msg">{errorMessage}</h5>
                <div className="login_form__close">
                    <button onClick={()=>closeForm()} type="button">X</button>
                </div>
                <label>Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}

                    required={true}

                />
                <label>Hasło</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    required={true}
                />
                <button className="login_form_btn__submit">Zaloguj się</button>
                <p>Nie masz konta? <button className="login_form_btn_register" type="button" onClick={()=>{showRegisterForm()}}>Zarejestruj się</button></p>
            </form>
        </div>
    )

}

export default LoginForm