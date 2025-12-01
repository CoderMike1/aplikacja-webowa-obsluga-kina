import {api} from "../api/client.js";


export const getMovies = () => api.get("/movies/categories/")

export const getScreenings = () => api.get("/screenings/")

export const getSeatMap = (auditorium_id) => api.get(`/tickets/screenings/${auditorium_id}/seats/`)

export const buyTicket = (payload) => api.post("/tickets/purchase/",{
                                                    headers:{
                                                        "content-type":"application/json"
                                                    },
                                                    body:payload
                                                })