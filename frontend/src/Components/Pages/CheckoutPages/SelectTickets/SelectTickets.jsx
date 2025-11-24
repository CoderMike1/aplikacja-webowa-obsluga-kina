import './SelectTickets.css'

const PRICES = {
    'ulgowy':20.00,
    'normalny':30.00
}

const SelectTickets = ({checkout_data,setTickets,setStep}) =>{
    console.log(checkout_data)
    return (

       <div className="checkout__tickets_container">
            <div className="checkout__tickets_list">
                {checkout_data.seats.map((seat,i)=>(
                    <div className="checkout__tickets_item" key={i}>
                        <div className="ticket_info">
                            <h3>Bilet #{i+1}</h3>
                            <p>Rząd {seat.split("-")[0]} Miejsce {seat.split("-")[1]}</p>
                        </div>
                        <div className="ticket_option">
                            <select className="ticket_option-select" onChange={(e)=>setTickets(e.target.value, seat,i,PRICES[e.target.value])}>
                                <option value="">Wybierz opcję</option>
                                <option value="ulgowy">Ulgowy 20zł</option>
                                <option value="normalny">Normalny 30zł</option>
                            </select>
                        </div>

                    </div>
                ))}
            </div>
           <div className="checkout_s1_submit">
               <button
                   disabled={(checkout_data.tickets.length !== checkout_data.seats.length)}
                   onClick={()=>{setStep(3)}}
               >Przejdź dalej</button>
           </div>
       </div>

    )

}

export default SelectTickets
