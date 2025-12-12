import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import './DashboardPage.css'
import SalesChart from './SalesChart/SalesChart.jsx'
import HourlyTicketSalesChart from './HourlyTicketSalesChart/HourlyTicketSalesChart.jsx'
import DashboardFilters from './DashboardFilters/DashboardFilters.jsx'
import SummaryCards from './SummaryCards/SummaryCards.jsx'
import TopMovies from './TopMovies/TopMovies.jsx'
import { api } from '../../../../api/client.js'
import { useAuthContext } from '../../../../context/Auth.jsx'

dayjs.extend(utc)

const DashboardPage = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [tickets, setTickets] = useState([])
    const defaultFrom = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
    const defaultTo = dayjs().format('YYYY-MM-DD')
    const [filters, setFilters] = useState({ from: defaultFrom, to: defaultTo, movieQuery: '', auditoriumId: null })
    const [appliedFilters, setAppliedFilters] = useState({ from: defaultFrom, to: defaultTo, movieQuery: '', auditoriumId: null })
    const { accessToken } = useAuthContext()

    const fetchSales = async (opts) => {
        setLoading(true)
        setError('')
        try {
            const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
            const nowTo = dayjs().toISOString()
            const nowFrom = dayjs().subtract(30, 'day').toISOString()
            const source = opts ?? appliedFilters
            const { from, to, movieQuery, auditoriumId } = source
            let pFrom = from ? dayjs(from).startOf('day').utc().toISOString() : nowFrom
            let pTo = to ? dayjs(to).endOf('day').utc().toISOString() : nowTo
            const params = {
                purchased_at_after: pFrom,
                purchased_at_before: pTo,
                payment_status: 'PAID',
            }
            if (movieQuery) params.movie_query = movieQuery
            if (auditoriumId) params.auditorium_id = auditoriumId
            const res = await api.get('/tickets/tickets/', { headers, params })
            setTickets(Array.isArray(res.data) ? res.data : [])
        } catch (e) {
            console.error(e)
            setError('Nie udało się pobrać danych sprzedaży')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSales()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken])

    const handleApply = () => {
        setAppliedFilters(filters)
        fetchSales(filters)
    }
    const handleClear = () => {
        const reset = { from: '', to: '', movieQuery: '', auditoriumId: null }
        setFilters(reset)
        setAppliedFilters(reset)
        fetchSales(reset)
    }
    const handleExport = () => {
        // Build CSV from current tickets
        const headers = ['purchased_at', 'movie_title', 'seats_count', 'total_price', 'payment_status', 'screening_id']
        const rows = tickets.map(t => [
            t.purchased_at,
            (t.movie_title || '').replaceAll('"', '""'),
            t.seats_count ?? '',
            t.total_price ?? '',
            t.payment_status ?? '',
            t.screening_id ?? ''
        ])
        const csv = [headers.join(','), ...rows.map(r => r.map((v, i) => i === 1 ? `"${v}"` : v).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fromStr = filters.from || dayjs().subtract(30, 'day').format('YYYY-MM-DD')
        const toStr = filters.to || dayjs().format('YYYY-MM-DD')
        a.download = `tickets_${fromStr}_to_${toStr}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="dashboard__container">
            {error && <div className="admin__error">{error}</div>}
            <DashboardFilters
                value={filters}
                onChange={setFilters}
                onApply={handleApply}
                onClear={handleClear}
                onExport={handleExport}
                accessToken={accessToken}
            />
            <div className="dashboard__grid">
                <div className="dashboard__col dashboard__col--full">
                    <SummaryCards tickets={tickets} />
                </div>
                <div className="dashboard__col">
                    <TopMovies tickets={tickets} loading={loading} />
                </div>
                <div className="dashboard__col">
                    <HourlyTicketSalesChart loading={loading} tickets={tickets} />
                </div>
                <div className="dashboard__col dashboard__col--full">
                    <SalesChart loading={loading} tickets={tickets} rangeStart={appliedFilters.from} rangeEnd={appliedFilters.to} />
                </div>
            </div>
        </div>
    )
}

export default DashboardPage
