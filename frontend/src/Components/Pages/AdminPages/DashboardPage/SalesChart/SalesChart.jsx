// komponent wyświetla wykres słupkowy sprzedaży biletów w wybranym zakresie dat
import { useMemo, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
import './SalesChart.css'

const SalesChart = ({ loading, tickets, rangeStart, rangeEnd }) => {
  const [error] = useState('')
  const [hover, setHover] = useState(null)
  const [mode, setMode] = useState('count')

  const series = useMemo(() => {
    const counts = new Map()
    for (const t of tickets) {
      const d = dayjs.utc(t.purchased_at).local().format('YYYY-MM-DD')
      if (mode === 'count') {
        counts.set(d, (counts.get(d) || 0) + (t.seats_count || 1))
      } else {
        const price = parseFloat(t.total_price || 0)
        counts.set(d, (counts.get(d) || 0) + (isNaN(price) ? 0 : price))
      }
    }
    const start = rangeStart ? dayjs(rangeStart).startOf('day') : dayjs().subtract(29, 'day').startOf('day')
    const end = rangeEnd ? dayjs(rangeEnd).endOf('day') : dayjs().endOf('day')
    const days = []
    const diffDays = Math.max(0, end.startOf('day').diff(start.startOf('day'), 'day'))
    const limit = Math.min(diffDays, 729)
    for (let i = 0; i <= limit; i++) {
      const d = start.add(i, 'day').format('YYYY-MM-DD')
      days.push({ date: d, value: counts.get(d) || 0 })
    }
    const observedMax = Math.max(0, ...days.map(d => d.value))
    const maxRaw = Math.max(1, observedMax)
    const roundBase = maxRaw < 10 ? 5 : maxRaw < 100 ? 10 : maxRaw < 500 ? 25 : 50
    const axisMax = Math.ceil(maxRaw / roundBase) * roundBase
    const total = days.reduce((acc, d) => acc + d.value, 0)
    const avg = total / days.length
    const len = days.length
    let labelStrategy = { type: 'step', step: 1 }
    if (len > 365) {
      labelStrategy = { type: 'month' }
    } else if (len > 180) {
      labelStrategy = { type: 'step', step: 14 }
    } else if (len > 90) {
      labelStrategy = { type: 'step', step: 7 }
    } else if (len > 30) {
      labelStrategy = { type: 'step', step: 3 }
    }
    return { days, axisMax, peak: observedMax, total, avg, labelStrategy }
  }, [tickets, mode, rangeStart, rangeEnd])

  if (loading) return <div>Ładowanie danych wykresu…</div>
  if (error) return <div style={{ color: 'tomato' }}>{error}</div>
  if (!tickets.length) {
    return (
      <div className="saleschart__container">
        <div className="saleschart__inner">
          <div className="saleschart__title">Sprzedaż biletów</div>
          <div className="saleschart__empty">Brak sprzedanych biletów w wybranym okresie lub dla danego filmu</div>
        </div>
      </div>
    )
  }

  return (
    <div className="saleschart__container">
      <div className="saleschart__inner">
        <div className="saleschart__header">
          <div className="saleschart__title">Sprzedaż biletów</div>
          <div className="saleschart__controls">
            <button className={`saleschart__btn${mode === 'count' ? ' is-active' : ''}`} onClick={() => setMode('count')}>Liczba biletów</button>
            <button className={`saleschart__btn${mode === 'revenue' ? ' is-active' : ''}`} onClick={() => setMode('revenue')}>Kwota</button>
          </div>
          <div className="saleschart__stats">
            <span>Łącznie: <strong>{mode === 'revenue' ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(series.total) : series.total}</strong></span>
            <span>Średnio/dzień: <strong>{mode === 'revenue' ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(series.avg) : Math.round(series.avg)}</strong></span>
            <span>Maks: <strong>{series.peak}</strong></span>
          </div>
        </div>
        <div className="saleschart__bars" style={{
          gridTemplateColumns: `repeat(${series.days.length}, 1fr)`
        }}>
          {series.days.map((d, idx) => {
            const hPct = (d.value / series.axisMax) * 100
            return (
              <div
                key={idx}
                className={`saleschart__bar${hover?.idx === idx ? ' is-hover' : ''}`}
                style={{ height: `${hPct}%` }}
              />
            )
          })}

          <div className="saleschart__yaxis">
            <span>{series.axisMax}</span>
            <span>{Math.round(series.axisMax / 2)}</span>
            <span>0</span>
          </div>
          <div className="saleschart__hoverlayer" style={{ gridTemplateColumns: `repeat(${series.days.length}, 1fr)` }}>
            {series.days.map((d, idx) => (
              <div
                key={idx}
                className="saleschart__hoverzone"
                onMouseEnter={() => setHover({ idx, date: d.date, value: d.value })}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </div>
        </div>
        <div className="saleschart__axis" style={{
          gridTemplateColumns: `repeat(${series.days.length}, 1fr)`
        }}>
          {series.days.map((d, idx) => {
            let shouldLabel = false
            let displayLabel = ''
            const dateObj = dayjs(d.date)
            if (series.labelStrategy.type === 'month') {
              if (dateObj.date() === 1 || idx === series.days.length - 1) {
                const isJan = dateObj.month() === 0
                displayLabel = isJan ? dateObj.format("MMM 'YY") : dateObj.format('MMM')
                shouldLabel = true
              }
            } else {
              const step = series.labelStrategy.step
              shouldLabel = (idx % step === 0) || (idx === series.days.length - 1)
              const labelFmt = step >= 7 ? 'MMM DD' : 'DD'
              displayLabel = dateObj.format(labelFmt)
            }
            return shouldLabel ? (
              <span key={idx} className="saleschart__axis_label" title={d.date}>{displayLabel}</span>
            ) : (
              <span key={idx} className="saleschart__axis_spacer" />
            )
          })}
        </div>
        {hover && (
          <div className="saleschart__tooltip">
            <div className="saleschart__tooltip_date">{hover.date}</div>
            <div className="saleschart__tooltip_value">{mode === 'revenue' ? 'Kwota' : 'Sprzedane bilety'}: <strong>{mode === 'revenue' ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(hover.value) : hover.value}</strong></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SalesChart
