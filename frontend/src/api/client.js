import axios from 'axios'



const authApi = axios.create({
    baseURL:"http://127.0.0.1:8000/api/accounts",
    withCredentials:true
})

export default authApi