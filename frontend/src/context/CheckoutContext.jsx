import {createContext, useContext, useEffect, useState} from "react";

const CheckoutContext = createContext(null)

const INITIAL_FORM = {
    movie_title:null,
    movie_image:null,
    movie_directors:null,
    showtime_hour:null,
    showtime_full_date:null,
    projection_type:null,
    auditorium:null,
    seats:[],
    tickets:[],
    customer:null,
    expiresAt:null
}
const STORAGE_KEY = "kino_checkout";
export const CheckoutProvider = ({children}) =>{

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


    const startCheckout = ({movie_title,movie_image,movie_directors,showtime_hour,showtime_full_date,projection_type,auditorium}) =>{

        const now = Date.now();
        setState({
            movie_title,
            movie_image,
            movie_directors,
            showtime_hour,
            showtime_full_date,
            projection_type,
            auditorium,
            seats: [],
            tickets: [],
            customer: null,
            expiresAt: now + 15 * 60 * 1000,
        });

    }

    const setSeats = (rowIndex, seatNumber, seat) => {
        if (seat.reserved) return;

        const id = `${rowIndex + 1}-${seatNumber}`;

        setState(prev => {
            const prevSeats = Array.isArray(prev.seats) ? prev.seats : [];

            const newSeats = prevSeats.includes(id)
                ? prevSeats.filter(s => s !== id) 
                : [...prevSeats, id];

            return {
                ...prev,
                seats: newSeats,
            };
        });
    };

    const resetCheckout= () =>{
        setState(INITIAL_FORM)
    }

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);
    const value = {
        state,
        startCheckout,
        setSeats,
        resetCheckout
    }
    return (
        <CheckoutContext.Provider value={value}>
            {children}
        </CheckoutContext.Provider>
    );

}

export const useCheckout = () => useContext(CheckoutContext);

