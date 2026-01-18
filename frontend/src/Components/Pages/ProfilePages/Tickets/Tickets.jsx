// komponent wyświetla listę zakupionych biletów
import React, { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import './Tickets.css'
import { authApi } from '../../../../api/client.js'
import { useAuthContext } from '../../../../context/Auth.jsx'

const Tickets = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const { accessToken } = useAuthContext()

    useEffect(() => {
        let mounted = true
        const fetchTickets = async () => {
            try {
                setLoading(true)
                setError(null)
                if (!accessToken) return
                const resp = await authApi.get('/me/tickets/', {
                    headers: { Authorization: `Bearer ${accessToken}` }
                })
                if (mounted) {
                    const ticketsArray = Array.isArray(resp.data) ? resp.data : []
                    const grouped = new Map()

                    for (const ticket of ticketsArray) {
                        const orderNum = ticket.order_number || 'unknown'
                        if (!grouped.has(orderNum)) {
                            grouped.set(orderNum, {
                                order_number: orderNum,
                                purchase_time: ticket.purchased_at,
                                screening: ticket.screening,
                                tickets: [],
                                total_price: 0
                            })
                        }
                        const order = grouped.get(orderNum)
                        order.tickets.push(ticket)
                        const priceNum = typeof ticket.price === 'string' ? parseFloat(ticket.price) : (ticket.price || 0)
                        order.total_price += isNaN(priceNum) ? 0 : priceNum
                    }

                    setOrders(Array.from(grouped.values()))
                }
            } catch (e) {
                if (mounted) setError('Nie udało się pobrać biletów.')
            } finally {
                if (mounted) setLoading(false)
            }
        }
        fetchTickets()
        return () => { mounted = false }
    }, [accessToken])

    return (
        <div className="tickets_root">
            <h2 className="tickets_heading">Twoje bilety</h2>
            {error && <div className="tickets_error">{error}</div>}
            {loading && <div className="tickets_loading">Ładowanie biletów...</div>}
            {!loading && !error && orders.length === 0 && (
                <div className="tickets_empty">Brak zakupionych biletów.</div>
            )}
            {!loading && !error && orders.length > 0 && (
                <ul className="tickets_list">
                    {orders.map((o, idx) => {
                        const purchased = o.purchase_time ? dayjs(o.purchase_time).format('DD.MM.YYYY HH:mm') : '-'
                        const screeningTime = o.screening?.start_time ? dayjs(o.screening.start_time).format('DD.MM.YYYY HH:mm') : '-'
                        const movieTitle = o.screening?.movie || 'Film'
                        const auditorium = o.screening?.auditorium_id ?? '-'
                        const totalText = typeof o.total_price === 'string' ? `${o.total_price} zł` : (o.total_price != null ? `${Number(o.total_price).toFixed(2)} zł` : '-')

                        return (
                            <li key={o.order_number || idx} className="ticket_item">
                                <div className="ticket_header">
                                        <div className="ticket_header_title">{movieTitle}</div>
                                    <div className="ticket_order">#{o.order_number || '-'}</div>
                                </div>

                                <div className="ticket_meta">
                                    <div><span>Seans:</span> {screeningTime}</div>
                                    <div><span>Sala:</span> {auditorium}</div>
                                    <div><span>Zakup:</span> {purchased}</div>
                                    <div><span>Cena łączna:</span> {totalText}</div>
                                </div>

                                {Array.isArray(o.tickets) && o.tickets.length > 0 && (
                                    <div className="ticket_details">
                                        {o.tickets.map((t, i) => {
                                            const itemPrice = typeof t.price === 'string' ? `${t.price} zł` : (t.price != null ? `${Number(t.price).toFixed(2)} zł` : '-')
                                            const seat = t.seats?.[0]
                                            const seatText = seat ? `Rząd ${seat.row_number}, Miejsce ${seat.seat_number}` : '-'
                                            return (
                                                <div key={t.id || i} className="ticket_detail_row">
                                                    <span className="ticket_detail_type">{t.ticket_type}</span>
                                                    <span className="ticket_detail_seat">{seatText}</span>
                                                    <span className="ticket_detail_price">{itemPrice}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

export default Tickets
