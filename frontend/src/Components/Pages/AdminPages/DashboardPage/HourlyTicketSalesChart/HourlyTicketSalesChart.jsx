import { useMemo, useRef, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import './HourlyTicketSalesChart.css'

const HourlyTicketSalesChart = ({ tickets = [], loading = false }) => {
    const [hover, setHover] = useState(null)
    const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

    const series = useMemo(() => {
        const base = selectedDate ? dayjs(selectedDate) : dayjs()
        const start = base.startOf('day')
        const end = base.endOf('day')
        const hours = Array.from({ length: 24 }, (_, h) => ({ hour: h, value: 0 }))
        const counts = new Map(hours.map(h => [h.hour, 0]))
        for (const t of tickets) {
            // Backend timestamps are UTC; convert to local time for charting
            const ts = dayjs.utc(t.purchased_at).local()
            // Include boundary tickets: >= start and <= end
            if (!ts.isBefore(start) && !ts.isAfter(end)) {
                const h = ts.hour()
                const val = (counts.get(h) || 0) + (t.seats_count || 1)
                counts.set(h, val)
            }
        }
        const data = hours.map(h => ({ hour: h.hour, value: counts.get(h.hour) || 0 }))
        const maxRaw = Math.max(1, ...data.map(d => d.value))
        const max = Math.ceil(maxRaw)
        // Determine y-axis step based on magnitude: 1 up to 10, 10 up to 100, 100 up to 1000, etc.
        const magnitude = Math.floor(Math.log10(max))
        const step = max <= 10 ? 1 : max <= 100 ? 10 : max <= 1000 ? 100 : Math.pow(10, magnitude - 2)
        // Build tick values from 0 to max rounded to nearest step, plus one extra step for headroom
        const top = Math.ceil(max) + step
        const ticks = []
        for (let v = 0; v <= top; v += step) ticks.push(v)
        const total = data.reduce((acc, d) => acc + d.value, 0)
        return { data, max, total, step, top, ticks }
    }, [tickets, selectedDate])

    const svgRef = useRef(null)

    const handleSvgMouseMove = (e) => {
        if (!svgRef.current) return
        const rect = svgRef.current.getBoundingClientRect()
        const xPx = e.clientX - rect.left
        const width = rect.width
        if (width <= 0) return
        // Map x to index 0..23, using bisect nearest
        const idxFloat = (xPx / width) * 23
        let idx = Math.round(idxFloat)
        if (idx < 0) idx = 0
        if (idx > 23) idx = 23
        const d = series.data[idx]
        const label = `${String(d.hour).padStart(2, '0')}:00`
        setHover({ idx, label, value: d.value })
    }

    const handleSvgMouseLeave = () => setHover(null)

    return (
        <div className="hourly__container">
            <div className="hourly__header">
                <div className="hourly__title">Dzienna sprzedaż biletów</div>
                <div className="hourly__stats">
                    <span>Łącznie: <strong>{series.total}</strong></span>
                    <span>Maks: <strong>{series.max}</strong></span>
                </div>
            </div>
            <div className="hourly__controls">
                <label>Data</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            {loading ? (
                <div className="hourly__loading">Ładowanie…</div>
            ) : (
                <div className="hourly__linewrap">
                    {/* SVG line chart over 24 hours */}
                    <svg
                        ref={svgRef}
                        className="hourly__svg"
                        viewBox="0 0 240 100"
                        preserveAspectRatio="none"
                        onMouseMove={handleSvgMouseMove}
                        onMouseLeave={handleSvgMouseLeave}
                    >
                        {/* dynamic horizontal grid lines based on ticks */}
                        {series.ticks.map((tick, i) => {
                            const y = 100 - (series.top > 0 ? (tick / series.top) * 100 : 0)
                            return <line key={i} x1="0" y1={y} x2="240" y2={y} className="hourly__grid" />
                        })}
                        {/* path */}
                        {(() => {
                            const pts = series.data.map((d, idx) => {
                                const x = (idx / 23) * 240
                                const y = 100 - (series.top > 0 ? (d.value / series.top) * 100 : 0)
                                return `${x},${y}`
                            })
                            const dAttr = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(' ')
                            return <path d={dAttr} className="hourly__line" />
                        })()}
                        {/* single hover point, shown only when hovering a given hour */}
                        {hover && (() => {
                            const d = series.data[hover.idx] || { hour: 0, value: 0 }
                            const x = (hover.idx / 23) * 240
                            const y = 100 - (series.top > 0 ? (d.value / series.top) * 100 : 0)
                            return <circle cx={x} cy={y} r={3} className="hourly__point" />
                        })()}
                    </svg>
                    <div className="hourly__xlabels">
                        {series.data.map((d, idx) => {
                            const label = `${String(d.hour).padStart(2, '0')}:00`
                            return (
                                <span
                                    key={idx}
                                    className="hourly__xlabel"
                                    onMouseEnter={() => setHover({ idx, label, value: d.value })}
                                    onMouseLeave={() => setHover(null)}
                                    title={label}
                                >
                                    {d.hour}
                                </span>
                            )
                        })}
                    </div>
                    <div className="hourly__yaxis">
                        {series.ticks.map((t, i) => (
                            <span key={i}>{t}</span>
                        ))}
                    </div>
                    {hover && (
                        <div className="hourly__tooltip hourly__tooltip--overlay">
                            <div className="hourly__tooltip_date">{hover.label}</div>
                            <div className="hourly__tooltip_value">Sprzedane bilety: <strong>{hover.value}</strong></div>
                        </div>
                    )}
                </div>
            )}

        </div>
    )
}

export default HourlyTicketSalesChart
