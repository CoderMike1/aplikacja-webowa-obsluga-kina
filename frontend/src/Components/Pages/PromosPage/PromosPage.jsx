import { useEffect, useState } from "react";
import "./PromosPage.css";

const weekdayNames = {
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
  7: "Niedziela",
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} o ${date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  return `${hours}:${minutes}`;
};

const PromosPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/tickets/promotions/");
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

  if (loading) return <p>Ładowanie promocji...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="program__container">
      <h1>Promocje</h1>

      <div className="program__movies">
        {promotions.map((promo) => (
          <div key={promo.id} className="movie__item">
            <div className="movie__info">
              <h4>{promo.name}</h4>

              <div className="movie__program">
                <div className="program__item">
                  <span>{promo.discount_percent}%</span>
                  <p>Zniżka</p>
                </div>

                <div className="program__item">
                  <span>{promo.min_tickets}</span>
                  <p>Min. biletów</p>
                </div>

                <div className="program__item">
                  <span>{weekdayNames[promo.weekday]}</span>
                  <p>Dzień tygodnia</p>
                </div>

                <div className="program__item">
                  <span>
                    {formatTime(promo.time_from)} - {formatTime(promo.time_to)}
                  </span>
                  <p>Godziny</p>
                </div>

                <div className="program__item">
                  <span>{formatDate(promo.valid_from)}</span>
                  <p>Od</p>
                </div>

                <div className="program__item">
                  <span>{formatDate(promo.valid_to)}</span>
                  <p>Do</p>
                </div>

                {promo.screening && (
                  <>
                    <div className="program__item">
                      <a
                        href={`filmy/${promo.screening.id}`}
                        style={{
                          textDecoration: "none",
                          color: "#0f172a",
                          fontWeight: "600",
                        }}
                      >
                        {promo.screening.movie.title}
                      </a>
                      <p>Film</p>
                    </div>

                    <div className="program__item">
                      <span>{formatDateTime(promo.screening.start_time)}</span>
                      <p>Seans</p>
                    </div>

                    <div className="program__item">
                      <span>{promo.screening.auditorium.name}</span>
                      <p>Sala</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromosPage;
