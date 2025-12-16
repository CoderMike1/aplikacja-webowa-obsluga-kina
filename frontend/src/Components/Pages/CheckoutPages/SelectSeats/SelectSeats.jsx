import './SelectSeats.css'
import {useEffect, useState} from "react";
import Spinner from "../../../../utils/Spinner/Spinner.jsx";
//import {seatMap} from "./seatMap.js";



const SelectSeats = ({auditorium,seats,setSeats,setStep,loadSeatMap}) =>{
    const [seatMap,setSeatMap] = useState([])

    useEffect(()=>{
        (async ()=>{
            const result = await loadSeatMap();
            setSeatMap(result)
        })()
    },[loadSeatMap])
    console.log(seatMap.length)
    return (
        <div className="checkout_auditorium__container">
            {seatMap.length === 0 && <Spinner/>}
            <h2 className="checkout_auditorium_title">Sala {auditorium}</h2>
            <div className="screen">Ekran</div>
            <div className="checkout_auditorium__list">
                {seatMap &&
                Object.keys(seatMap).map((rowKey)=>{
                    const rowSeats = seatMap[rowKey];
                    const rowNumber = Number(rowKey);

                    return (
                        <div className="checkout_auditorium__row" key={rowKey}>
                            <div className="checkout_auditorium__row-number">{rowNumber}</div>
                            <div className="checkout_auditorium_row_seats">
                                {rowSeats.map((seat) => {
                                    const {id:seat_id,row,seat_number,reserved} = seat
                                    const id = `${seat_id}-${rowNumber}-${seat_number}`
                                    const isSelected = seats.includes(id);
                                    return (
                                        <button
                                            key={id}
                                            className={[
                                                "seat",
                                                reserved ? "seat--reserved" : "seat--available",
                                                isSelected ? "seat--selected" : "",
                                                //seat.type === "wheelchair" ? "seat--wheelchair" : "",
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                            onClick={() =>
                                                setSeats(id,reserved)
                                            }
                                        >
                                            {seat_number}
                                        </button>
                                    );

                                })}
                            </div>
                            <div className="checkout_auditorium__row-number">{rowNumber}</div>
                        </div>
                    )

                })
                }
            </div>

            <div className="checkout_auditorium_legend">
                        <span>
                              <span className="legend-box legend-box--available" /> miejsca dostępne
                            </span>
                <span>
                              <span className="legend-box legend-box--selected" /> wybrane miejsca
                            </span>
                <span>
                              <span className="legend-box legend-box--reserved" /> miejsca
                              niedostępne
                            </span>

            </div>

            <div className="checkout_s1_submit">
                <button
                    disabled={seats.length === 0}
                    onClick={()=>setStep(2)}
                >Przejdź dalej</button>
            </div>

        </div>
    )

}


export default SelectSeats

