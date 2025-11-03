import {useState} from "react";
import '../Forms.css'
import {useAuthUI} from "../../../context/authUIContext.jsx";

const RegisterForm = () =>{

    const [firstName,setFirstName] = useState("");
    const [lastName,setLastName] = useState("")
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [confirmPassword,setConfirmPassword] = useState("")

    const [errorMessage,setErrorMessage] = useState("")


    const {closeForm,showLoginForm} = useAuthUI()

    const handleRegister = (e) =>{
        e.preventDefault()

        if (password !== confirmPassword){
            setErrorMessage("Hasła się różnią")
        }
        else{
            console.log("jest git")
            setErrorMessage("")
        }

    }


    return (

        <div className="register_form__container">

            <form onSubmit={handleRegister}>
                <h3 className="register_form__header">Rejestracja</h3>
                <h5 className="register_form__err_msg">{errorMessage}</h5>
                <div className="register_form__close">
                    <button onClick={()=>closeForm()} type="button">X</button>
                </div>
                <label>Imię</label>
                <input
                type="text"
                value={firstName}
                onChange={(e)=>setFirstName(e.target.value)}
                required={true}
                />
                <label>Nazwisko</label>
                <input
                type="text"
                value={lastName}
                onChange={(e)=>setLastName(e.target.value)}
                required={true}
                />
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
                <label>Powtórz hasło</label>
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e)=>setConfirmPassword(e.target.value)}
                    required={true}
                />
                <button className="register_form_btn__submit">Załóż konto</button>
                <p>Masz konto? <button className="register_form_btn_login" type="button" onClick={()=>{showLoginForm()}}>Zaloguj się</button></p>
            </form>
        </div>

    )

}

export default RegisterForm