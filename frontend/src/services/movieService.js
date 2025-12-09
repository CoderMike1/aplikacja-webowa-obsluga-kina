import { api } from "../api/client.js";


export const getMovies = () => api.get("/movies/categories/")

export const getScreenings = () => api.get("/screenings/")

export const getSeatMap = (auditorium_id) => api.get(`/tickets/screenings/${auditorium_id}/seats/`)


//export const buyTicket = (payload) => api.post("/tickets/purchase/", payload, {headers: {"content-type": "application/json"}})
export const buyTicket = (payload, accessToken) =>
    api.post(
        "/tickets/purchase/",
        payload,
        {
            headers: {
                "content-type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        }
    )

export const getTicketPDF = (order_number) => api.get(`/tickets/ticket/${order_number}/pdf/`,{
    responseType:"blob"
})


