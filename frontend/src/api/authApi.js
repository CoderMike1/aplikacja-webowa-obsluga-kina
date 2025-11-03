import clientReq from "./client.js";


export const loginRequest = (email,password) =>
    clientReq.post("/login",{email,password})

export const registerRequest = (payload) =>
    clientReq.post("/register",payload)


