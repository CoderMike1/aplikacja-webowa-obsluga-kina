//komponent formularza rejestracka
import {useState} from "react";
import '../Forms.css'
import {useAuthUI} from "../../../context/authUIContext.jsx";
import {useAuthContext} from "../../../context/Auth.jsx";

const RegisterForm = () =>{

    const [username,setUsername] = useState("")
    const [firstName,setFirstName] = useState("");
    const [lastName,setLastName] = useState("")
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const [confirmPassword,setConfirmPassword] = useState("")


    const [errorMessage,setErrorMessage] = useState("")

    const {register} = useAuthContext();

    const [processing,setProcessing] = useState(false)


    const {closeForm,showLoginForm} = useAuthUI()

    const clearForm = () =>{
        setUsername("");
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("")
    }

    const handleRegister = async (e) =>{
        e.preventDefault()
        setProcessing(true)

        if (password !== confirmPassword){
            setErrorMessage("Hasła się różnią")
            setProcessing(false)
        }
        else{

            const payload = {
                first_name:firstName,
                last_name:lastName,
                email:email,
                password:password,
                username:username
            }

            try{
                const resp = await register(payload)
                closeForm()
                clearForm()
                setProcessing(false)
            }
            catch (err){
                if (err.response && err.response.status === 400){
                    setErrorMessage(err.response.data)
                    setProcessing(false)
                }
                else{
                    setErrorMessage("Wystąpił błąd. Spróbuj ponownie.");
                    setProcessing(false)
                }
            }
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
                <label htmlFor="username">Nazwa użytkownika</label>
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e)=>setUsername(e.target.value)}
                    required={true}
                />
                <label htmlFor="first_name">Imię</label>
                <input
                type="text"
                id="first_name"
                value={firstName}
                onChange={(e)=>setFirstName(e.target.value)}
                required={true}
                />
                <label htmlFor="last_name">Nazwisko</label>
                <input
                type="text"
                id="last_name"
                value={lastName}
                onChange={(e)=>setLastName(e.target.value)}
                required={true}
                />
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e)=>setEmail(e.target.value)}
                    required={true}

                />
                <label htmlFor="password">Hasło</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    required={true}
                />
                <label htmlFor="confirm_password">Powtórz hasło</label>
                <input
                    type="password"
                    id="confirm_password"
                    value={confirmPassword}
                    onChange={(e)=>setConfirmPassword(e.target.value)}
                    required={true}
                />
                <button className="register_form_btn__submit">{!processing ? "Załóż konto" :"Rejestracja..."}</button>
                <p>Masz konto? <button className="register_form_btn_login" type="button" onClick={()=>{showLoginForm()}}>Zaloguj się</button></p>
            </form>
        </div>

    )

}

export default RegisterForm