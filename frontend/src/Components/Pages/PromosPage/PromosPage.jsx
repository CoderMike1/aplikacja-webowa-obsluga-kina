//komponent dla strony Promocje

import { useEffect, useState } from "react";
import "./PromosPage.css";
import Spinner from "../../../utils/Spinner/Spinner.jsx";

const weekdayNames = {
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
  7: "Niedziela",
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString("pl-PL");

const formatDateTime = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.toLocaleDateString("pl-PL")} • ${d.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  return `${h}:${m}`;
};

const PromosPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await fetch(
          "http://localhost:8000/api/tickets/promotions/"
        );
        if (!res.ok) throw new Error("Błąd podczas pobierania promocji");
        const data = await res.json();
        setPromotions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  if (loading) return <Spinner />;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="promos__container">
      <h1 className="promos__title">Promocje</h1>

      <div className="promos__grid">
        {promotions.map((promo) => (
          <div key={promo.id} className="promo__card">
            <div className="promo__badge">
              -{promo.discount_percent}%
            </div>

            <h3 className="promo__name">{promo.name}</h3>

            <div className="promo__meta">
              <div>
                <span>{weekdayNames[promo.weekday]}</span>
                <p>Dzień</p>
              </div>
              <div>
                <span>
                  {formatTime(promo.time_from)}–{formatTime(promo.time_to)}
                </span>
                <p>Godziny</p>
              </div>
              <div>
                <span>{promo.min_tickets}</span>
                <p>Min. biletów</p>
              </div>
            </div>

            <div className="promo__valid">
              Obowiązuje: {formatDate(promo.valid_from)} –{" "}
              {formatDate(promo.valid_to)}
            </div>

            {promo.screening && (
              <div className="promo__screening">
                <a href={`filmy/${promo.screening.id}`}>
                  🎬 {promo.screening.movie.title}
                </a>
                <span>
                  🕒 {formatDateTime(promo.screening.start_time)}
                </span>
                <span>
                  🏛 {promo.screening.auditorium.name}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromosPage;
