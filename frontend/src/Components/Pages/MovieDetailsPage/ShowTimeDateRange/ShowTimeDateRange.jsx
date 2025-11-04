import {useMemo} from "react";
import './ShowTimeDateRange.css'

const ShowTimeDateRange = ({selectedDate,setSelectedDate}) =>{

    const days = useMemo(()=> getNextDays(),[])

    console.log(selectedDate)

    return (
        <div className="showtime_range">
            {days.map((day,idx) => {

                const isToday = idx === 0;
                const isSelected = selectedDate  === day.date;
                return (
                    <button
                        key={day.date}
                        type="button"
                        className={
                            "day-card" +
                            (isSelected ? " day-card--active" : "") +
                            (!isSelected && !isToday ? " day-card--normal" : "")
                        }
                        onClick={() => setSelectedDate?.(day.date)}
                    >
                        <span className="day-card__month">{day.month}</span>
                        <span className="day-card__weekday">{day.weekday}</span>
                        <span className="day-card__day">{day.dayNumber}</span>
                    </button>
                );
            })}

            <button
                type="button"
                className="day-card day-card--select"
                onClick={() => {
                }}
            >
                <span className="day-card__select-text">Select</span>
                <span className="day-card__select-text">Day</span>
            </button>



        </div>

    )

}
const WEEKDAY = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];
const MONTH = ["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"];

const getNextDays = () =>{
    const count = 6;

    const arr = [];
    const today = new Date();

    for (let i =0;i<count;i++){
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        arr.push({
            date: d.toISOString().slice(0, 10),
            dayNumber: d.getDate(),
            weekday: WEEKDAY[d.getDay()],
            month: MONTH[d.getMonth()],
        });
    }

    return arr;

}


export default ShowTimeDateRange