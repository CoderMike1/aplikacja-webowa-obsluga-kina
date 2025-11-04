import {api} from "../api/client.js";


export const getMovies = () => api.get("/movies/categories/")