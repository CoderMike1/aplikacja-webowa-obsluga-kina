import './SelectSeats.css'
import {seatMap} from "./seatMap.js";



const SelectSeats = ({auditorium,seats,setSeats,setStep}) =>{


    return (
        <div className="checkout_auditorium__container">
            <h2 className="checkout_auditorium_title">Sala {auditorium}</h2>
            <div className="screen">Ekran</div>
            <div className="checkout_auditorium__list">
                {seatMap.map((row,rowIndex) =>(
                    <div className="checkout_auditorium__row" key={rowIndex}>
                        <div className="checkout_auditorium__row-number">{rowIndex+1}</div>

                        <div className="checkout_auditorium_row_seats">
                            {row.map((seat,seatIndex) => {
                                const id = `${rowIndex + 1}-${seat.number}`;
                                const isSelected = seats.includes(id);

                                return (
                                    <button
                                        key={seatIndex}
                                        className={[
                                            "seat",
                                            seat.reserved ? "seat--reserved" : "seat--available",
                                            isSelected ? "seat--selected" : "",
                                            seat.type === "wheelchair" ? "seat--wheelchair" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onClick={() =>
                                            setSeats(rowIndex, seat.number, seat)
                                        }
                                    >
                                        {seat.number}
                                    </button>
                                );

                            })}
                        </div>
                        <div className="checkout_auditorium__row-number">{rowIndex + 1}</div>
                    </div>
                ))}
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
                <span>
                              <span className="legend-box legend-box--wheelchair" /> miejsca dla
                              niepełnosprawnych
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

