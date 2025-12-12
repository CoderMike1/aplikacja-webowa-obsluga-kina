import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import './DashboardFilters.css'
import { api } from '../DashboardFilters/../../../../../api/client.js'

const DashboardFilters = ({ value, onChange, onApply, onClear, onExport, accessToken }) => {
    const [auditoriums, setAuditoriums] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
                const [audRes] = await Promise.all([
                    api.get('/auditoriums/', { headers }),
                ])
                setAuditoriums(Array.isArray(audRes.data) ? audRes.data : [])
            } catch {
                // silent fail; filters can still work as free-text inputs
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [accessToken])

    const todayStr = dayjs().format('YYYY-MM-DD')
    const handleChange = (patch) => {
        const next = { ...value, ...patch }
        // Clamp 'to' to today
        if (next.to && dayjs(next.to).isAfter(dayjs(todayStr))) {
            next.to = todayStr
        }
        // Ensure from <= to
        if (next.from && next.to && dayjs(next.from).isAfter(dayjs(next.to))) {
            // If user just changed 'from', align it to 'to'
            if (Object.prototype.hasOwnProperty.call(patch, 'from')) {
                next.from = next.to
            } else {
                next.to = next.from
            }
        }
        // Limit range length to <= 365 days
        if (next.from && next.to) {
            const fromD = dayjs(next.from)
            const toD = dayjs(next.to)
            const diff = toD.startOf('day').diff(fromD.startOf('day'), 'day')
            if (diff > 365) {
                if (Object.prototype.hasOwnProperty.call(patch, 'from')) {
                    // User moved 'from'; set 'to' to from + 365 (but not beyond today)
                    let newTo = fromD.add(365, 'day')
                    if (newTo.isAfter(dayjs(todayStr))) newTo = dayjs(todayStr)
                    next.to = newTo.format('YYYY-MM-DD')
                } else if (Object.prototype.hasOwnProperty.call(patch, 'to')) {
                    // User moved 'to'; set 'from' to to - 365
                    const newFrom = toD.subtract(365, 'day')
                    next.from = newFrom.format('YYYY-MM-DD')
                }
            }
        }
        onChange?.(next)
    }

    return (
        <div className="dashfilters__container">
            <div className="dashfilters__group">
                <label>Od</label>
                <input
                    type="date"
                    value={value.from || ''}
                    onChange={(e) => handleChange({ from: e.target.value })}
                    max={todayStr}
                />
            </div>
            <div className="dashfilters__group">
                <label>Do</label>
                <input
                    type="date"
                    value={value.to || ''}
                    onChange={(e) => handleChange({ to: e.target.value })}
                    max={todayStr}
                />
            </div>
            <div className="dashfilters__group">
                <label>Film lub reżyser</label>
                <input
                    type="text"
                    placeholder="np. Nolan lub Incepcja"
                    value={value.movieQuery || ''}
                    onChange={(e) => handleChange({ movieQuery: e.target.value })}
                />
            </div>
            <div className="dashfilters__group">
                <label>Sala</label>
                <select
                    value={value.auditoriumId || ''}
                    onChange={(e) => handleChange({ auditoriumId: e.target.value || null })}
                >
                    <option value="">Wszystkie</option>
                    {auditoriums.map((a) => (
                        <option key={a.id} value={a.id}>{a.name || `Sala ${a.id}`}</option>
                    ))}
                </select>
            </div>
            <div className="dashfilters__actions">
                <button className="dashfilters__btn dashfilters__btn--primary" onClick={onApply} disabled={loading}>Filtruj</button>
                <button className="dashfilters__btn" onClick={onClear} disabled={loading}>Wyczyść</button>
                <button className="dashfilters__btn" onClick={onExport} disabled={loading}>Eksport CSV</button>
            </div>
        </div>
    )
}

export default DashboardFilters
