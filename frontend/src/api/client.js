import axios from 'axios'



const clientReq = axios.create({
    baseURL:"http://127.0.0.1:8000/api/accounts",
    withCredentials:true
})


clientReq.interceptors.response.use(
    (response) => response,
    async (error) =>{
        const req = error.config;

        if (error.response?.status === 401 && !req._retry){
            req._retry = true;
            try{
                await clientReq.post("/token/refresh/");

                return clientReq(req)
            }
            catch (e){

            }
        }
        return Promise.reject(error)

    }
)

export default clientReq