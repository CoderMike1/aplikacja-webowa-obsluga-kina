import {useCheckout} from "../../../../context/CheckoutContext.jsx";
import './Success.css'
const Success = () =>{

    const { state } = useCheckout();

    const tickets = state.tickets || [];
    const service_fee = 4;
    const total_price = tickets.reduce((acc, t) => acc + (t.price || 0), 0) + service_fee;

    const customer = state.customer || {};
    const firstName = customer.first_name || '';
    const lastName = customer.last_name || '';
    const email = customer.email || '';
    const phone_number = customer.phone_number || '';

    const orderNumber = "#123456";


    return (
        <div className="checkout__success__container">
            <div className="checkout__success__header">
                <h2>Bilet został kupiony!</h2>
                <p>Dziękujemy za zakup w Last Kino 🎬</p>
            </div>

            <div className="checkout__success__order_id">
                <span>Numer zamówienia:</span>
                <strong>{orderNumber}</strong>
            </div>

            <div className="checkout__success__content">
                <div className="success__card success__order_card">
                    <h3>Podsumowanie zamówienia</h3>

                    <div className="success__movie_info">
                        <h4>{state.movie_title || "Tytuł filmu"}</h4>
                        <p>{state.movie_directors}</p>
                        <p>
                            {state.projection_type && <span>{state.projection_type}</span>}
                            {state.auditorium && (
                                <>
                                    {" • "}
                                    <span>Sala {state.auditorium}</span>
                                </>
                            )}
                        </p>
                        {(state.showtime_hour || state.showtime_full_date) && (
                            <p className="success__date">
                                {state.showtime_hour && <span>Godzina {state.showtime_hour}</span>}
                                {state.showtime_full_date && (
                                    <>
                                        {" • "}
                                        <span>{state.showtime_full_date}</span>
                                    </>
                                )}
                            </p>
                        )}
                    </div>

                    <div className="success__tickets_list">
                        {tickets.map((ticket, i) => (
                            <div className="success__ticket_row" key={i}>
                                <div className="success__ticket_details">
                                    <span className="ticket_title">Bilet #{ticket.id + 1}</span>
                                    <p>
                                        Rząd {ticket.seat.split("-")[0]} Miejsce {ticket.seat.split("-")[1]}
                                    </p>
                                    <p className="ticket_type">{ticket.ticketType}</p>
                                </div>
                                <span className="ticket_price">
                                    {ticket.price} zł
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="success__contact_block">
                        <h4>Dane kontaktowe</h4>
                        <p><strong>Imię i nazwisko:</strong> {firstName || lastName ? `${firstName} ${lastName}` : "—"}</p>
                        <p><strong>E-mail:</strong> {email || "—"}</p>
                        <p><strong>Numer telefonu:</strong> {phone_number || "—"}</p>
                    </div>

                    <div className="success__summary_row success__service_fee">
                        <span>Opłata serwisowa</span>
                        <span>{service_fee} zł</span>
                    </div>

                    <div className="success__summary_row success__total">
                        <span>Łącznie zapłacono</span>
                        <span>{total_price} zł</span>
                    </div>
                </div>
            </div>

        </div>
    )

}

export default Success

