//kontekst przechowujacy informacje o to jaki formularz ma byc wyswietlany

import {createContext, useContext, useState} from "react";


const AuthUIContext = createContext(null)


export const AuthUIProvider = ({children}) =>{

    const [authFormOpen,setAuthFormOpen] = useState(false)
    const [authFormMode,setAuthFormMode] = useState("login")    // login  or register


    const showLoginForm = () =>{
        setAuthFormOpen(true)
        setAuthFormMode("login")
    }

    const showRegisterForm = () =>{
        setAuthFormOpen(true)
        setAuthFormMode("register")
    }

    const closeForm = () =>{
        setAuthFormOpen(false)
    }


    return (
        <AuthUIContext.Provider
        value={{authFormOpen,authFormMode,showLoginForm,showRegisterForm,closeForm}}
        >
            {children}
        </AuthUIContext.Provider>
    )
}

export const useAuthUI = () => useContext(AuthUIContext)

