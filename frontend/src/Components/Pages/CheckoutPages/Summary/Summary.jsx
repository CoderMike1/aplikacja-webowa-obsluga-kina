import './Summary.css'
import { useCheckout } from "../../../../context/CheckoutContext.jsx";
import { useEffect, useState, useMemo } from "react";
import ProcessingPayment from "../ProcessingPayment/ProcessingPayment.jsx";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../../context/Auth.jsx";
import { buyTicket } from "../../../../services/movieService.js";
import usePromotionPreview from "../../../../hooks/usePromotionPreview.js";

const sleep = async (ms) => new Promise(resolve => setTimeout(resolve, ms));

const Summary = () => {
  const [errorMessage, setErrorMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const { state: checkout_data, setCustomer, setPayment, setOrderConfirmation } = useCheckout();
  const { user, isLoggedIn, accessToken } = useAuthContext();
  const navigate = useNavigate();

  const tickets = checkout_data.tickets || [];
  const service_fee = 0;

 const seatIds = useMemo(
  () => tickets.map(ticket => ({
    row_number: Number(ticket.seat.split("-")[1]),
    seat_number: Number(ticket.seat.split("-")[2])
  })),
  [tickets]
);


  const ticketTypeId = tickets[0]?.ticketType === 'normalny' ? 1 : 2;

  const { promotionData, loading: promoLoading, error: promoError } = usePromotionPreview(
    checkout_data.screening_id,
    ticketTypeId,
    seatIds
  );

  const total_price = tickets.reduce((acc, ticket) => acc + ticket.price, 0) + service_fee;
  const firstName = checkout_data.customer.first_name || '';
  const lastName = checkout_data.customer.last_name || '';
  const email = checkout_data.customer.email || '';
  const phoneNumber = checkout_data.customer.phone_number || '';
  const paymentMethod = checkout_data.payment_method || null;

  useEffect(() => {
    if (isLoggedIn) {
      setCustomer({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
      });
    }
  }, [isLoggedIn, user]);

  const handleBuyButton = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (firstName && lastName && email && phoneNumber && paymentMethod) {
      setProcessing(true);

      const payload = {
        screening_id: checkout_data.screening_id,
        tickets: tickets.map((ticket) => ({
          ticket_type_id: ticket.ticketType === 'normalny' ? 1 : 2,
          seats: [
            { row_number: ticket.seat.split("-")[1], seat_number: ticket.seat.split("-")[2] }
          ],
          first_name: firstName,
          last_name: lastName,
          email: email,
          phone_number: phoneNumber
        }))
      };

      try {
        const resp = await buyTicket(payload, accessToken);

        await sleep(2000);
        if (resp.status !== 201) {
          const errorMessages = [];
          if (resp.data?.tickets) {
            resp.data.tickets.forEach(ticket => {
              if (ticket.email) errorMessages.push(ticket.email);
              if (ticket.phone_number) errorMessages.push(ticket.phone_number);
            });
          }
          setErrorMessage(errorMessages.length > 0 ? errorMessages.join(' | ') : "Błąd podczas zakupu biletów");
          setProcessing(false);
        } else {
          const data = await resp.data;

          const order_confirmation_payload = {
  total_price: data.total_price,
  order_number: data.order_number,
  first_name: data.customer_info.first_name,
  last_name: data.customer_info.last_name,
  email: data.customer_info.email,
  phone_number: data.customer_info.phone,
  screening_info: {
    id: data.tickets[0].screening.id,
    movie_title: data.tickets[0].screening.movie,
    movie_start_time: data.tickets[0].screening.start_time,
    auditorium: data.tickets[0].screening.auditorium_id
  },
  tickets: data.tickets.map((ticket) => ({
    ticket_type: ticket.ticketType === 'normalny',
    seat: { row_number: ticket.seat.row_number, seat_number: ticket.seat.seat_number },
    price: ticket.price
  })),
  promotion: promotionData?.promotion || null
};

          setOrderConfirmation(order_confirmation_payload);
          navigate('/success');
        }
      } catch (error) {
        console.error('Błąd przy wysyłaniu zapytania:', error);
        setErrorMessage("Błąd podczas zakupu biletów");
        setProcessing(false);
      }
    } else {
      setErrorMessage('Uzupełnij wszystkie wymagane pola i wybierz metodę płatności.');
      setProcessing(false);
    }
  };

  return (
    <div className="checkout__summary_container">
      {processing && <ProcessingPayment />}
      <div className="checkout__summary_left">
        <div className="summary__contact_info">
          <h3>Dane kontaktowe</h3>
          <div className="contact__info_labels">
            <label>Imię</label>
            <input placeholder="Jan" value={firstName} onChange={(e) => setCustomer({ first_name: e.target.value })} />
            <label>Nazwisko</label>
            <input placeholder="Kowalski" value={lastName} onChange={(e) => setCustomer({ last_name: e.target.value })} />
            <label>E-mail</label>
            <input placeholder="jan.kowalski@example.com" value={email} onChange={(e) => setCustomer({ email: e.target.value })} />
            <label>Numer telefonu</label>
            <input placeholder="+48 600 000 000" value={phoneNumber} onChange={(e) => setCustomer({ phone_number: e.target.value })} />
          </div>
        </div>

        <div className="summary__payment_options">
          <h3>Płatność</h3>
          <div className="payment__methods">
            <label className="payment__method">
              <input type="radio" name="payment" value="blik" onChange={(e) => setPayment(e.target.value)} />
              <span>Blik</span>
            </label>
            <label className="payment__method">
              <input type="radio" name="payment" value="card" onChange={(e) => setPayment(e.target.value)} />
              <span>Karta płatnicza</span>
            </label>
            <label className="payment__method">
              <input type="radio" name="payment" value="bank-transfer" onChange={(e) => setPayment(e.target.value)} />
              <span>Przelew online</span>
            </label>
          </div>
        </div>
      </div>

      <div className="checkout__summary_right">
        <div className="summary__info">
          <h3>Podsumowanie zamówienia</h3>

          {promoLoading && <p>Sprawdzanie promocji...</p>}
          {promoError && <p className="summary__error">{promoError}</p>}

          <div className="summary__tickets">
            {tickets.map((ticket, i) => (
              <div className="summary__row" key={i}>
                <div className="row_right_info">
                  <div>
                    <span>Bilet #{ticket.id + 1}</span>
                    <p>Rząd {ticket.seat.split("-")[1]} Miejsce {ticket.seat.split("-")[2]}</p>
                  </div>
                  <p>{ticket.ticketType}</p>
                </div>
                <span>
                  {promotionData
                    ? (promotionData.final_price / tickets.length).toFixed(2) + " zł"
                    : ticket.price + " zł"}
                </span>
              </div>
            ))}
          </div>

          <div className="summary__row summary__row-fee">
            <span>Opłata serwisowa</span>
            <span>{service_fee} zł</span>
          </div>

          <div className="summary__row summary__row-total">
            <span>Łącznie do zapłaty</span>
            <span>
              {promotionData ? promotionData.final_price.toFixed(2) : total_price.toFixed(2)} zł
            </span>
          </div>

          {promotionData?.promotion && (
            <div className="summary__promotion">
              Promocja: {promotionData.promotion.name} (-{promotionData.promotion.discount_percent}%)
            </div>
          )}
        </div>

        <button className="summary__pay_button" onClick={handleBuyButton}>
          Zapłać
        </button>

        {errorMessage && (
          <p className="summary__error">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

export default Summary;
