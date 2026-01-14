//context przechowujacy sesje uzytkownika

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi } from "../api/client.js";


const AuthContext = createContext(null)


export const AuthProvider = ({ children }) => {

    const [accessToken, setAccessToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true)
    const [authLoading, setAuthLoading] = useState(false)

    const [userDetails, setUserDetails] = useState({})

    const isLoggedIn = !!accessToken && !!user;


    const fetchMe = useCallback(
        async (tokenOverride) => {
            const token = tokenOverride || accessToken;
            if (!token) return;

            try {
                const res = await authApi.get("/me/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                setUser(res.data);
            } catch (err) {
                console.error("fetchMe error", err);
                setUser(null);
            }
        },
        [accessToken]
    );

    const refreshAccessToken = useCallback(async () => {
        try {
            const res = await authApi.post("/token/refresh/", null, {
                needAuth: false
            });
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
                    await fetchMe(newAccess);
                }
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, [refreshAccessToken]);


    const login = async (email, password) => {
        setAuthLoading(true);
        try {
            const res = await authApi.post("/login/", { email, password }, { needAuth: false });
            const { access } = res.data;
            setAccessToken(access);
            authApi.defaults.headers.common["Authorization"] = `Bearer ${access}`;
            await fetchMe(access);
            return res.data;
        }
        catch (err) {
            throw err
        }
        finally {
            setAuthLoading(false);
        }
    };

    const register = async (payload) => {
        setAuthLoading(true);
        try {
            const res = await authApi.post("/register/", payload, { needAuth: false });
            const { access } = res.data;
            setAccessToken(access);
            authApi.defaults.headers.common["Authorization"] = `Bearer ${access}`;
            await fetchMe(access);
        } finally {
            setAuthLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authApi.post('/logout/', null, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            });
        } catch (err) {
        } finally {
            setAccessToken(null);
            setUser(null);
            delete authApi.defaults.headers.common["Authorization"];
        }
    };



    const getUserDetails = async () => {
        const token = accessToken;
        if (!token) return;
        try {
            const res = await authApi.get("/me/", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setUserDetails(res.data);
        } catch (err) {
            console.error("fetchMe error", err);
            setUser(null);
        }
    }



    return (
        <AuthContext.Provider value={{ user, accessToken, login, register, logout, isLoggedIn, refreshAccessToken, getUserDetails, userDetails,loading }}>
            {children}
        </AuthContext.Provider>
    )

}

export const useAuthContext = () => useContext(AuthContext)

