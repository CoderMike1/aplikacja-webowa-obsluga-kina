//komponent symulujacy przetwarzanie platnosci

import './ProcessingPayment.css'
const ProcessingPayment = () =>{

    return (
        <div className="payment__processing__container">
            <div className="payment__processing__box">
                <div className="payment__processing__spinner" />
                <p>Przetwarzanie płatności...</p>
            </div>
        </div>
    );

}

export default ProcessingPayment