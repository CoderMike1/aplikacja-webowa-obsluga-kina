import './Summary.css'
import {useCheckout} from "../../../../context/CheckoutContext.jsx";
import {useState} from "react";
import ProcessingPayment from "../ProcessingPayment/ProcessingPayment.jsx";
import {useNavigate} from "react-router-dom";

const sleep = async (ms) => new Promise(resolve => setTimeout(resolve,ms))

const Summary = () =>{
    const [errorMessage,setErrorMessage] = useState('');
    const [processing,setProcessing] = useState(false)
    const {state:checkout_data,setCustomer,setPayment} = useCheckout()

    const navigate = useNavigate();

    const tickets = checkout_data.tickets
    const service_fee = 4;
    const total_price = tickets.reduce((acc, ticket) => acc + ticket.price, 0) + service_fee;

    const firstName = checkout_data.customer.first_name || '';
    const lastName = checkout_data.customer.last_name || '';
    const email = checkout_data.customer.email || '';
    const phoneNumber = checkout_data.customer.phone_number || '';
    const paymentMethod = checkout_data.payment_method || null


    const handleBuyButton = async (e) =>{
        e.preventDefault()
        setErrorMessage('')
        if (firstName !== '' && lastName !== '' && email !== '' && phoneNumber !== '' && paymentMethod){
            setProcessing(true)
            await sleep(5000)
            navigate('/success')

        }
        else{
            setErrorMessage('Uzupełnij wszystkie wymagane pola i wybierz metodę płatności.');
        }

    }


    return (
        <div className="checkout__summary_container">
            {processing && <ProcessingPayment/>}
            <div className="checkout__summary_left">
                <div className="summary__contact_info">
                    <h3>Dane kontaktowe</h3>
                    <div className="contact__info_labels">
                        <label>Imię</label>
                        <input placeholder="Jan" value={firstName} onChange={(e)=>setCustomer({first_name: e.target.value})}/>
                        <label>Nazwisko</label>
                        <input placeholder="Kowalski" value={lastName} onChange={(e)=>setCustomer({last_name:e.target.value})}/>
                        <label>E-mail</label>
                        <input placeholder="jan.kowalski@example.com" value={email} onChange={(e)=>setCustomer({email:e.target.value})}/>
                        <label>Numer telefonu</label>
                        <input placeholder="+48 600 000 000" value={phoneNumber} onChange={(e)=>setCustomer({phone_number: e.target.value})}/>
                    </div>
                </div>

                <div className="summary__payment_options">
                    <h3>Płatność</h3>
                    <div className="payment__methods">
                        <label className="payment__method">
                            <input type="radio" name="payment" value="blik" onChange={(e)=>setPayment(e.target.value)} />
                            <span>Blik</span>
                        </label>
                        <label className="payment__method">
                            <input type="radio" name="payment" value="card" onChange={(e)=>setPayment(e.target.value)} />
                            <span>Karta płatnicza</span>
                        </label>
                        <label className="payment__method">
                            <input type="radio" name="payment" value="bank-transfer" onChange={(e)=>setPayment(e.target.value)} />
                            <span>Przelew online</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="checkout__summary_right">
                <div className="summary__info">
                    <h3>Podsumowanie zamówienia</h3>

                    <div className="summary__tickets">
                        {
                            tickets.map((ticket,i)=>(
                                <div className="summary__row" key={i}>
                                    <div className="row_right_info">
                                        <div>
                                            <span>Bilet #{ticket.id+1}</span>
                                            <p>Rząd {ticket.seat.split("-")[0]} Miejsce {ticket.seat.split("-")[1]}</p>
                                        </div>
                                        <p>{ticket.ticketType}</p>
                                    </div>
                                    <span>{ticket.price} zł</span>
                                </div>
                            ))
                        }
                    </div>

                    <div className="summary__row summary__row-fee">
                        <span>Opłata serwisowa</span>
                        <span>{service_fee} zł</span>
                    </div>

                    <div className="summary__row summary__row-total">
                        <span>Łącznie do zapłaty</span>
                        <span>{total_price} zł</span>
                    </div>

                </div>

                <button className="summary__pay_button" onClick={handleBuyButton}>
                    Zapłać
                </button>
                {errorMessage && (
                    <p className="summary__error">{errorMessage}</p>
                )}
            </div>
        </div>
    )


}

export default Summary

