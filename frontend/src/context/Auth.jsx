import {createContext, useCallback, useContext, useEffect, useState} from "react";
import authApi from "../api/client.js";


const AuthContext = createContext(null)


export const AuthProvider = ({children}) =>{

    const [accessToken,setAccessToken] = useState(null);
    const [user,setUser] = useState(null);
    const [loading,setLoading] = useState(true)
    const [authLoading,setAuthLoading] = useState(false)

    const isLoggedIn = !!accessToken && !!user;

    useEffect(() => {
        if (accessToken) {
            authApi.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        } else {
            delete authApi.defaults.headers.common["Authorization"];
        }
    }, [accessToken]);

    const fetchMe = useCallback(async () => {
        try {
            const res = await authApi.get("/me/");
            console.log(res)
            setUser(res.data);
        } catch (err) {
            console.error("fetchMe error", err);
            setUser(null);
        }
    }, []);

    const refreshAccessToken = useCallback(async () => {
        try {
            const res = await authApi.post("/token/refresh/");
            const { access } = res.data;
            setAccessToken(access);
            return access;
        } catch (err) {
            console.error("refreshAccessToken error", err);
            setAccessToken(null);
            setUser(null);
            return null;
        }
    }, []);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const newAccess = await refreshAccessToken();
                if (newAccess) {
                    await fetchMe();
                }
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, [refreshAccessToken, fetchMe]);


    const login = async (email, password) => {
        setAuthLoading(true);
        try {
            const res = await authApi.post("/login/", { email, password });
            const { access } = res.data.tokens;
            setAccessToken(access);
            authApi.defaults.headers.common["Authorization"] = `Bearer ${access}`;
            await fetchMe();
            return res.data;
        }
        catch (err){
            throw err
        }
        finally {
            setAuthLoading(false);
        }
    };

    const register = async (payload) => {
        setAuthLoading(true);
        try {
            const res = await authApi.post("/register/", payload);
            const { access } = res.data.tokens;
            setAccessToken(access);
            authApi.defaults.headers.common["Authorization"] = `Bearer ${access}`;
            await fetchMe();
        } finally {
            setAuthLoading(false);
        }
    };



    return (
        <AuthContext.Provider value={{user, accessToken,login,register,isLoggedIn}}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuthContext = () => useContext(AuthContext)