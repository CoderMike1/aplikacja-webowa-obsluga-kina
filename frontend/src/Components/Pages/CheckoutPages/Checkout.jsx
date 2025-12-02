import './Checkout.css'
import {useCheckout} from "../../../context/CheckoutContext.jsx";
import {useEffect, useState} from "react";
import SelectSeats from "./SelectSeats/SelectSeats.jsx";
import SelectTickets from "./SelectTickets/SelectTickets.jsx";
import Summary from "./Summary/Summary.jsx";


const PROGRESS_BAR = {
    1:18,
    2:50,
    3:87
}

const Checkout = () =>{
    const {state:checkout_data,setSeats,setTickets,setStep,loadSeatMap} = useCheckout()

    const step = checkout_data.step;
    const seats = checkout_data.seats;
    const image = checkout_data.movie_image;
    const title = checkout_data.movie_title;
    const directors = checkout_data.movie_directors;
    const showtime_hour = checkout_data.showtime_hour;
    let showtime_full_date = checkout_data.showtime_full_date;
    showtime_full_date = new Date(showtime_full_date).toLocaleDateString("pl-PL", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const auditorium = checkout_data.auditorium;
    const projection_type = checkout_data.projection_type


    console.log(checkout_data)

    return (
        <div className="checkout_s1_container">
            <div className="checkout_s1_inner">
                <div className="checkout__inner_header">
                    <div className="checkout__inner_header_left">
                        <img src={image} alt={title}/>
                        <div className="checkout_inner_screening_info">
                            <h4>{title}</h4>
                            <p>{directors}</p>
                            <span>DUBBING {projection_type}</span>
                        </div>
                    </div>
                    <div className="checkout_inner_header_middle">
                        <div className="checkout_progress">
                            <div className="checkout_progress_labels">
                                <span
                                    className={
                                        "checkout_progress_label" + (step >= 1 ? " checkout_progress_label--active" : "")
                                    }
                                    onClick={()=>setStep(1)}
                                >
                                  wybór<br />miejsca
                                </span>
                                <span
                                    className={
                                        "checkout_progress_label" + (step >= 2 ? " checkout_progress_label--active" : "")
                                    }
                                    onClick={()=>setStep(2)}
                                >
                                  wybór<br />biletu
                                </span>
                                <span
                                    className={
                                        "checkout_progress_label" + (step >= 3 ? " checkout_progress_label--active" : "")
                                    }
                                    onClick={()=>setStep(3)}
                                >
                                  dane kontaktowe
                                </span>
                            </div>

                            <div className="checkout_progress_bar">
                                <div
                                    className="checkout_progress_bar_fill"
                                    style={{ width: `${PROGRESS_BAR[step]}%` }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="checkout__inner_header_right">
                        <span>Godzina {showtime_hour}</span>
                        <p>{showtime_full_date}</p>
                    </div>
                </div>
                {
                    step === 1 ?
                        <SelectSeats auditorium={auditorium} seats={seats} setSeats={setSeats} setStep={setStep} loadSeatMap={loadSeatMap}/>
                        :
                        step === 2?
                            <SelectTickets checkout_data={checkout_data} setTickets={setTickets} setStep={setStep}/>
                            :
                            <Summary/>
                }

            </div>

        </div>
    )

}

export default Checkout

