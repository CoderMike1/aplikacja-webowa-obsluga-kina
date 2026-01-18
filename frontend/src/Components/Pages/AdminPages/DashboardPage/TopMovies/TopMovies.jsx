// komponent pokazuje listę najbardziej oglądanych filmów
import { useMemo } from 'react'
import './TopMovies.css'

const TopMovies = ({ tickets = [], limit = 5, loading = false }) => {
    const top = useMemo(() => {
        const map = new Map()
        for (const t of tickets) {
            const key = t.movie_title || '—'
            const prev = map.get(key) || { seats: 0, revenue: 0 }
            const price = parseFloat(t.total_price || 0)
            map.set(key, { seats: prev.seats + (t.seats_count || 0), revenue: prev.revenue + (isNaN(price) ? 0 : price) })
        }
        const arr = Array.from(map.entries()).map(([title, v]) => ({ title, ...v }))
        arr.sort((a, b) => b.seats - a.seats)
        return arr.slice(0, limit)
    }, [tickets, limit])

    const fmt = (n) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n)

    return (
        <div className="topmovies__container">
            <div className="topmovies__header">Najbardziej oglądane filmy</div>
            <div className="topmovies__list">
                {loading && (
                    <div className="topmovies__empty">Ładowanie...</div>
                )}
                {top.map((m, idx) => (
                    <div key={idx} className="topmovies__item">
                        <div className="topmovies__rank">{idx + 1}</div>
                        <div className="topmovies__meta">
                            <div className="topmovies__title">{m.title}</div>
                            <div className="topmovies__stats">Bilety: <strong>{m.seats}</strong> - Przychód: <strong>{fmt(m.revenue)}</strong></div>
                        </div>
                    </div>
                ))}
                {!loading && top.length === 0 && (
                    <div className="topmovies__empty">Brak danych dla wybranego zakresu lub dla wybranych filmów</div>
                )}
            </div>
        </div>
    )
}

export default TopMovies
