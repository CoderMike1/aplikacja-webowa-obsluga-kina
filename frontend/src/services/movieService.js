import {api} from "../api/client.js";


export const getMovies = () => api.get("/movies/categories/")

export const getScreenings = () => api.get("/screenings/")