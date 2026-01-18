// komponent wyświetla podsumowanie sprzedaży na podstawie sprzedaży biletów
import './SummaryCards.css'

const SummaryCards = ({ tickets = [] }) => {
    let totalRevenue = 0
    let totalTickets = 0
    for (const t of tickets) {
        const price = parseFloat(t.total_price || 0)
        totalRevenue += isNaN(price) ? 0 : price
        totalTickets += t.seats_count || 0
    }

    const fmt = (n) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n)

    return (
        <div className="summary__container">
            <div className="summary__card">
                <div className="summary__label">Łączna kwota</div>
                <div className="summary__value">{fmt(totalRevenue)}</div>
            </div>
            <div className="summary__card">
                <div className="summary__label">Liczba biletów</div>
                <div className="summary__value">{totalTickets}</div>
            </div>
        </div>
    )
}

export default SummaryCards
