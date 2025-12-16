import { useState, useEffect } from "react";

function usePromotionPreview(screeningId, ticketTypeId, seatIds = []) {
  const [promotionData, setPromotionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!screeningId || !ticketTypeId || seatIds.length === 0) {
      setPromotionData(null);
      return;
    }

    const fetchPromotion = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("http://localhost:8000/api/tickets/check-promotion/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            screening_id: screeningId,
            ticket_type_id: ticketTypeId,
            seat_ids: seatIds,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Błąd przy sprawdzaniu promocji");
        }

        const data = await response.json();
        setPromotionData({
          final_price: Number(data.final_price),
          promotion: data.promotion || null
        });

      } catch (err) {
        console.error("usePromotionPreview error:", err);
        setError(err.message || "Nieznany błąd");
        setPromotionData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotion();
  }, [screeningId, ticketTypeId, seatIds]);

  return { promotionData, loading, error };
}

export default usePromotionPreview;
