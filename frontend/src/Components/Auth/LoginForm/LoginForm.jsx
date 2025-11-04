import {useState} from "react";
import {useAuthUI} from "../../../context/authUIContext.jsx";

import '../Forms.css'
import {useAuthContext} from "../../../context/Auth.jsx";
const LoginForm = () =>{
    const [email,setEmail] = useState("michal@mail.com")
    const [password,setPassword] = useState("123456789")

    const [errorMessage,setErrorMessage] = useState("")

    const {closeForm,showRegisterForm} = useAuthUI()

    const {login} = useAuthContext()

    const handleLogin = async (e) =>{
        e.preventDefault()
        setErrorMessage("")
        try{
            const resp = await login(email,password)

            setEmail("")
            setPassword("")
            closeForm()
        }
        catch (err){
            if (err.response?.status === 400 || err.response?.status === 401){
                setErrorMessage("Niepoprawny e-mail lub hasło.")
            }
            else{
                setErrorMessage("Wystąpił błąd serwera, spróbuj ponownie.")
            }
        }

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