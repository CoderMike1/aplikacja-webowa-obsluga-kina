import {useCheckout} from "../../../../context/CheckoutContext.jsx";
import './Success.css'
const Success = () =>{

    const {state, orderConfirmation } = useCheckout();

    const {total_price,order_number,first_name,last_name,email,phone_number,screening_info,tickets} = orderConfirmation

    const service_fee = 0;

    return (
        <div className="checkout__success__container">
            <div className="checkout__success__header">
                <h2>Bilet został kupiony!</h2>
                <p>Dziękujemy za zakup w Last Kino 🎬</p>
            </div>

            <div className="checkout__success__order_id">
                <span>Numer zamówienia:</span>
                <strong>{order_number}</strong>
            </div>

            <div className="checkout__success__content">
                <div className="success__card success__order_card">
                    <h3>Podsumowanie zamówienia</h3>

                    <div className="success__movie_info">
                        <h4>{screening_info.movie_title || "Tytuł filmu"}</h4>
                        <p>state.movie_directors</p>
                        <p>
                            {state.projection_type && <span>{state.projection_type}</span>}
                            {screening_info.auditorium && (
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
                                    <span className="ticket_title">Bilet #{i+ 1}</span>
                                    <p>
                                        Rząd {ticket.seat.row_number} Miejsce {ticket.seat.seat_number}
                                    </p>
                                    <p className="ticket_type">{ticket.ticket_type}</p>
                                </div>
                                <span className="ticket_price">
                                    {ticket.price} zł
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="success__contact_block">
                        <h4>Dane kontaktowe</h4>
                        <p><strong>Imię i nazwisko:</strong> {first_name || last_name ? `${first_name} ${last_name}` : "—"}</p>
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

