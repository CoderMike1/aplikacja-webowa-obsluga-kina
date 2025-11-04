import {  useEffect } from "react";
import {useAuthContext} from "../context/Auth.jsx";
import authApi from "../api/client.js";


const useAxiosAuth = () => {
    const { accessToken, refreshAccessToken } = useAuthContext()

    useEffect(() => {
        const reqIntercept = authApi.interceptors.request.use(
            (config) => {
                if (accessToken && !config.headers["Authorization"]) {
                    config.headers["Authorization"] = `Bearer ${accessToken}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        const resIntercept = authApi.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (
                    error.response?.status === 401 &&
                    !originalRequest._retry
                ) {
                    originalRequest._retry = true;
                    const newAccess = await refreshAccessToken();
                    if (newAccess) {
                        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
                        return authApi(originalRequest);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            authApi.interceptors.request.eject(reqIntercept);
            authApi.interceptors.response.eject(resIntercept);
        };
    }, [accessToken, refreshAccessToken]);

    return authApi;
};

export default useAxiosAuth;
