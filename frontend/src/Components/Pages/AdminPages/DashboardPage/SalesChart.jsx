import { useEffect, useMemo, useState } from 'react'
import { api } from '../../../../api/client.js'
import { useAuthContext } from '../../../../context/Auth.jsx'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import './saleschart.css'

// Placeholder chart component. Once ticket sales API is known,
// fetch aggregated sales per day and render a simple line chart.
// For now, it shows a loading stub and a call-to-action.
const SalesChart = () => {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const { accessToken } = useAuthContext()
  const [hover, setHover] = useState(null)

  useEffect(() => {
    const fetchSales = async () => {
      setLoading(true)
      setError('')
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        // last 30 days window
        const to = dayjs().toISOString()
        const from = dayjs().subtract(30, 'day').toISOString()
        const res = await api.get('/tickets/tickets/', {
          headers,
          params: { purchased_at_after: from, purchased_at_before: to, payment_status: 'PAID' }
        })
        setTickets(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        console.error(e)
        setError('Nie udało się pobrać danych sprzedaży')
      } finally {
        setLoading(false)
      }
    }
    fetchSales()
  }, [accessToken])

  const series = useMemo(() => {
    // group by date (YYYY-MM-DD)
    const counts = new Map()
    for (const t of tickets) {
      const d = dayjs.utc(t.purchased_at).local().format('YYYY-MM-DD')
      counts.set(d, (counts.get(d) || 0) + (t.seats_count || 1))
    }
    // ensure full 30-day range present
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
      days.push({ date: d, value: counts.get(d) || 0 })
    }
    const maxRaw = Math.max(1, ...days.map(d => d.value))
    // nice max for axis (round up to nearest 5 or 10)
    const roundBase = maxRaw < 10 ? 5 : 10
    const max = Math.ceil(maxRaw / roundBase) * roundBase
    const total = days.reduce((acc, d) => acc + d.value, 0)
    const avg = total / days.length
    return { days, max, total, avg }
  }, [tickets])

  if (loading) return <div>Ładowanie danych wykresu…</div>
  if (error) return <div style={{ color: 'tomato' }}>{error}</div>
  if (!tickets.length) {
    return (
      <div className="saleschart__container">
        <div className="saleschart__inner">
          <div className="saleschart__title">Sprzedaż biletów — ostatnie 30 dni</div>
          <div className="saleschart__empty">Brak sprzedanych biletów w wybranym okresie.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="saleschart__container">
      <div className="saleschart__inner">
        <div className="saleschart__header">
          <div className="saleschart__title">Sprzedaż biletów — ostatnie 30 dni</div>
          <div className="saleschart__stats">
            <span>Łącznie: <strong>{series.total}</strong></span>
            <span>Średnio/dzień: <strong>{Math.round(series.avg)}</strong></span>
            <span>Maks: <strong>{series.max}</strong></span>
          </div>
        </div>
        <div className="saleschart__bars">
          {series.days.map((d, idx) => {
            const hPct = (d.value / series.max) * 100
            return (
              <div
                key={idx}
                className={`saleschart__bar${hover?.idx === idx ? ' is-hover' : ''}`}
                style={{ height: `${hPct}%` }}
                onMouseEnter={() => setHover({ idx, date: d.date, value: d.value })}
                onMouseLeave={() => setHover(null)}
              />
            )
          })}
          {/* Show x-axis labels every 5 days for clarity */}

          {/* y-axis ticks (left overlay) */}
          <div className="saleschart__yaxis">
            <span>{series.max}</span>
            <span>{Math.round(series.max / 2)}</span>
            <span>0</span>
          </div>
        </div>
        <div className="saleschart__axis">
          <span className="saleschart__axis_label">{series.days[0]?.date}</span>
          <span className="saleschart__axis_label">{series.days[series.days.length - 1]?.date}</span>
        </div>
        {hover && (
          <div className="saleschart__tooltip">
            <div className="saleschart__tooltip_date">{hover.date}</div>
            <div className="saleschart__tooltip_value">Sprzedane bilety: <strong>{hover.value}</strong></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesChart
