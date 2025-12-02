import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import './Tickets.css'
import { authApi } from '../../../../api/client.js'

const Tickets = () => {
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        let mounted = true
        const fetchTickets = async () => {
            try {
                setLoading(true)
                setError(null)
                const resp = await authApi.get('/me/tickets/')
                if (mounted) {
                    setTickets(Array.isArray(resp.data) ? resp.data : [])
                }
            } catch (e) {
                if (mounted) setError('Nie udało się pobrać biletów.')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchTickets()
        return () => { mounted = false }
    }, [])

    const renderSeats = (seats = []) => {
        if (!seats.length) return '—'
        return seats.map(s => `Rząd ${s.row_number}, Miejsce ${s.seat_number}`).join(' | ')
    }

    return (
        <div className="tickets_root">
            <h2 className="tickets_heading">Twoje bilety</h2>
            {error && <div className="tickets_error">{error}</div>}
            {loading && <div className="tickets_loading">Ładowanie biletów...</div>}
            {!loading && !error && tickets.length === 0 && (
                <div className="tickets_empty">Brak zakupionych biletów.</div>
            )}
            {!loading && !error && tickets.length > 0 && (
                <ul className="tickets_list">
                    {tickets.map(t => {
                        const purchased = t.purchased_at ? dayjs(t.purchased_at).format('DD.MM.YYYY HH:mm') : '—'
                        const screeningTime = t.screening?.start_time ? dayjs(t.screening.start_time).format('DD.MM.YYYY HH:mm') : '—'
                        const movieTitle = t.screening?.movie || 'Film'
                        const priceText = typeof t.price === 'string' ? `${t.price} zł` : (t.price != null ? `${t.price.toFixed(2)} zł` : '—')
                        return (
                            <li key={t.id} className="ticket_item">
                                <div className="ticket_header">
                                    <div className="ticket_movie">{movieTitle}</div>
                                    <div className="ticket_order">#{t.order_number || t.id}</div>
                                </div>
                                <div className="ticket_meta">
                                    <div><span>Seans:</span> {screeningTime}</div>
                                    <div><span>Zakup:</span> {purchased}</div>
                                    <div><span>Typ:</span> {t.ticket_type || 'Standard'}</div>
                                    <div><span>Cena:</span> {priceText}</div>
                                    <div style={{ gridColumn: '1 / -1' }}><span>Miejsca:</span> {renderSeats(t.seats)}</div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export default Tickets
