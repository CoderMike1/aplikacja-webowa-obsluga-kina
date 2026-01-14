//funkcja wyswietlajaca filmy w zaleznosci od dnia

import { useMemo, useState } from "react";
import "./ShowTimeDateRange.css";

const VISIBLE_DAYS = 6;
const TOTAL_DAYS = 30;

const ShowTimeDateRange = ({ selectedDate, setSelectedDate }) => {
    const days = useMemo(() => getNextDays(TOTAL_DAYS), []);
    const [startIndex, setStartIndex] = useState(0);

    const handleSelectDateFromRange = (day_date) => {
        setSelectedDate(day_date);
    };

    const handlePrev = () => {
        setStartIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setStartIndex((prev) =>
            Math.min(prev + 1, days.length - VISIBLE_DAYS)
        );
    };

    const visibleDays = days.slice(startIndex, startIndex + VISIBLE_DAYS);

    return (
        <div className="showtime_range">
            <button
                type="button"
                className="day-card-nav day-card-nav--prev"
                onClick={handlePrev}
                disabled={startIndex === 0}
            >
                ‹
            </button>

            <div className="showtime_range__days">
                {visibleDays.map((day) => {
                    const isSelected = selectedDate === day.date;
                    return (
                        <button
                            key={day.date}
                            type="button"
                            className={
                                "day-card" +
                                (isSelected ? " day-card--active" : "")
                            }
                            onClick={() => handleSelectDateFromRange(day.date)}
                        >
                            <span className="day-card__month">{day.month}</span>
                            <span className="day-card__weekday">{day.weekday}</span>
                            <span className="day-card__day">{day.dayNumber}</span>
                        </button>
                    );
                })}
            </div>

            <button
                type="button"
                className="day-card-nav day-card-nav--next"
                onClick={handleNext}
                disabled={startIndex + VISIBLE_DAYS >= days.length}
            >
                ›
            </button>
        </div>
    );
};

const WEEKDAY = [
    "Niedziela",
    "Poniedziałek",
    "Wtorek",
    "Środa",
    "Czwartek",
    "Piątek",
    "Sobota",
];
const MONTH = [
    "Styczeń",
    "Luty",
    "Marzec",
    "Kwiecień",
    "Maj",
    "Czerwiec",
    "Lipiec",
    "Sierpień",
    "Wrzesień",
    "Październik",
    "Listopad",
    "Grudzień",
];

const getNextDays = (count) => {
    const arr = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
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
};

export default ShowTimeDateRange;
