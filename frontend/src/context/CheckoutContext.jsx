//context obslugujacy dane podczas procesu zakupu biletow

import {createContext, useCallback, useContext, useEffect, useState} from "react";
import {getSeatMap} from "../services/movieService.js";

const CheckoutContext = createContext(null)

const INITIAL_FORM = {
    step:1,
    movie_title:null,
    movie_image:null,
    movie_directors:null,
    screening_id:null,
    showtime_hour:null,
    showtime_full_date:null,
    projection_type:null,
    auditorium:null,
    seats:[],
    tickets:[],
    customer: {
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
    },
    payment_method:null,
    expiresAt:null
}
const STORAGE_KEY = "kino_checkout";
export const CheckoutProvider = ({children}) =>{

    const [orderConfirmation,setOrderConfirmation] = useState({})

    const [state, setState] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed;
            } catch {
                return INITIAL_FORM;
            }
        }
        return INITIAL_FORM;
    });


    const startCheckout = ({movie_title,movie_image,movie_directors,screening_id,showtime_hour,showtime_full_date,projection_type,auditorium}) =>{

        const now = Date.now();
        setState({
            step:1,
            movie_title,
            movie_image,
            movie_directors,
            screening_id,
            showtime_hour,
            showtime_full_date,
            projection_type,
            auditorium,
            seats: [],
            tickets: [],
            customer: {
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
            },
            payment_method:null,
            expiresAt: now + 15 * 60 * 1000,
        });

    }

    const setStep = (new_step)=>{
        setState(prev=>({
            ...prev,
            step:new_step
        }))
    }
    const setSeats = (id,reserved) => {
        if (reserved) return;

        setState(prev => {
            const prevSeats = Array.isArray(prev.seats) ? prev.seats : [];

            const newSeats = prevSeats.includes(id)
                ? prevSeats.filter(s => s !== id) 
                : [...prevSeats, id];

            const ticketsShouldBeCleared = newSeats.length !== prevSeats.length;

            return {
                ...prev,
                seats: newSeats,
                tickets: ticketsShouldBeCleared ? [] : prev.tickets,
            };
        });
    };

    const setTickets = (ticketType, seatNumber,idx,price) =>{
        const newTicket = {id:idx,ticketType,seat:seatNumber,price}
        setState(prev =>{
            let newTickets;
            const prevTickets = Array.isArray(prev.tickets)  ? prev.tickets : [];
            if (ticketType === ''){
                newTickets = prevTickets.filter(t=>t.seat !== seatNumber)
            }
            else{
                const exists = prevTickets.some(t=> t.seat === seatNumber);

                newTickets = exists ? prevTickets.map(t=> t.seat === seatNumber ? newTicket : t)
                    : [...prevTickets,newTicket]
            }
            return {
                ...prev,
                tickets: newTickets,
            };
        })

    }

    const setCustomer = (updates) =>{
        setState(prev=>{
            const prevCustomer = prev.customer || {};

            return {
                ...prev,
                customer:{
                    ...prevCustomer,
                    ...updates
                }
            }

        })
    }

    const setPayment = (paymentOption) =>{
        setState(prev=>(
            {
                ...prev,
                payment_method:paymentOption
            }
        ))
    }
    const resetCheckout= () =>{
        setState(INITIAL_FORM)
    }

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const loadSeatMap = useCallback(async ()=>{
        const resp = await getSeatMap(state.screening_id)
        if (resp.status !== 200){
            return null
        }
        else{
            const data = await resp.data
            return data
        }
    },[state.screening_id])



    const value = {
        state,
        startCheckout,
        setSeats,
        resetCheckout,
        setTickets,
        setStep,
        setCustomer,
        setPayment,
        loadSeatMap,
        orderConfirmation,
        setOrderConfirmation
    }
    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    );

}

export const useCheckout = () => useContext(CheckoutContext);

