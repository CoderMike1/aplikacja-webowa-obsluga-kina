import axios from 'axios'



export const authApi = axios.create({
    baseURL:"http://localhost:8000/api/accounts",
    withCredentials:true
})

export const api = axios.create({
    baseURL:"http://localhost:8000/api"
})

