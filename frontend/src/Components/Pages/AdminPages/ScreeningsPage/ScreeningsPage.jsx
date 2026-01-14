import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../../../../api/client.js'
import { useAuthContext } from '../../../../context/Auth.jsx'
import '../AdminPage.css'
import './ScreeningsPage.css'
import Spinner from "../../../../utils/Spinner/Spinner.jsx";

const ScreeningsPage = () => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [groups, setGroups] = useState([])
    const [next, setNext] = useState(null)
    const [previous, setPrevious] = useState(null)
    const [count, setCount] = useState(0)
    const { accessToken, user } = useAuthContext()

    const [filters, setFilters] = useState({
        movie_title: '',
        directors: '',
        auditorium_id: '',
        projection_type: '',
        start_after: dayjs().format('YYYY-MM-DDTHH:mm'),
        start_before: '',
    })

    const [editingId, setEditingId] = useState(null)
    const [editForm, setEditForm] = useState({
        auditorium_id: '',
        projection_type_id: '',
        start_time: ''
    })

    const [showAdd, setShowAdd] = useState(false)
    const [addForm, setAddForm] = useState({
        movie_id: '',
        auditorium_id: '',
        projection_type_id: '',
        start_time: ''
    })
    const [addErrors, setAddErrors] = useState({})

    const [movieOptions, setMovieOptions] = useState([])
    const [auditoriumOptions, setAuditoriumOptions] = useState([])
    const [projectionTypeOptions, setProjectionTypeOptions] = useState([])
    const [editErrors, setEditErrors] = useState({})

    const [expandedKeys, setExpandedKeys] = useState(new Set())

    const toggleExpand = (key) => {
        setExpandedKeys(prev => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                next.add(key)
            }
            return next
        })
    }

    const fetchMovies = async () => {
        try {
            const res = await api.get('/movies/', { params: { page_size: 50 } })
            const items = res.data?.results || res.data || []
            const today = dayjs().format('YYYY-MM-DD')
            const allowed = items.filter(m => m?.cinema_release_date)
            setMovieOptions(allowed)
        } catch (e) {
            console.error(e)
        }
    }

    const fetchAuditoriums = async () => {
        try {

            const res = await api.get('/auditoriums/')
            setAuditoriumOptions(Array.isArray(res.data) ? res.data : [])
        } catch (e) {
            console.error(e)
        }
    }

    const fetchProjectionTypes = async () => {
        try {
            const res = await api.get('/screenings/projection-types/')
            setProjectionTypeOptions(Array.isArray(res.data) ? res.data : [])
        } catch (e) {
            console.error(e)
        }
    }

    const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

    const fetchPage = async (url = null) => {
        setLoading(true)
        setError('')
        try {
            let res
            if (url) {
                res = await api.get(url)
            } else {
                const params = {}
                if (filters.movie_title) params.movie_title = filters.movie_title
                if (filters.directors) params.directors = filters.directors
                if (filters.auditorium_id) params.auditorium_id = Number(filters.auditorium_id)
                if (filters.projection_type) params.projection_type = filters.projection_type
                if (filters.start_after) {
                    const d = new Date(filters.start_after)
                    params.start_after = d.toISOString()
                }
                if (filters.start_before) {
                    const d = new Date(filters.start_before)
                    params.start_before = d.toISOString()
                }
                res = await api.get('/screenings/', { params })
            }
            const data = res.data
            setGroups(data.results || [])
            setNext(data.next || null)
            setPrevious(data.previous || null)
            setCount(data.count || 0)
        } catch (e) {
            console.error(e)
            setError('Nie udało się pobrać listy seansów')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPage()
    }, [])

    const startEdit = (screening) => {
        setEditingId(screening.id)
        setEditErrors({})
        setError('')
        setEditForm({
            auditorium_id: screening.auditorium?.id || '',
            projection_type_id: screening.projection_type?.id || '',
            start_time: screening.start_time ? dayjs(screening.start_time).format('YYYY-MM-DDTHH:mm') : ''
        })
    }

    const submitEdit = async (e) => {
        e.preventDefault()
        if (!editingId) return
        setError('')
        try {
            const payload = {
                auditorium_id: editForm.auditorium_id ? Number(editForm.auditorium_id) : undefined,
                projection_type_id: editForm.projection_type_id ? Number(editForm.projection_type_id) : null,
                start_time: editForm.start_time ? new Date(editForm.start_time).toISOString() : null,
            }
            await api.patch(`/screenings/${editingId}/`, payload, { headers: authHeaders })
            setEditingId(null)
            setEditErrors({})
            fetchPage()
        } catch (e) {
            console.error(e)
            if (e?.response?.status === 400 && e.response.data) {
                setEditErrors(e.response.data)
            } else {
                setError('Nie udało się zaktualizować seansu')
            }
        }
    }

    const submitAdd = async (e) => {
        e.preventDefault()
        setError('')
        try {
            const chosenId = addForm.movie_id ? Number(addForm.movie_id) : null
            const allowedIds = new Set(movieOptions.map(m => Number(m.id)))
            if (!chosenId || !allowedIds.has(chosenId)) {
                setAddErrors(prev => ({
                    ...prev,
                    movie_id: [
                        'Wybierz film z listy dostępnych (premiera kinowa nie później niż dziś).'
                    ]
                }))
                return
            }
            const payload = {
                movie_id: addForm.movie_id ? Number(addForm.movie_id) : undefined,
                auditorium_id: addForm.auditorium_id ? Number(addForm.auditorium_id) : undefined,
                projection_type_id: addForm.projection_type_id ? Number(addForm.projection_type_id) : null,
                start_time: addForm.start_time ? new Date(addForm.start_time).toISOString() : null,
            }
            await api.post('/screenings/', payload, { headers: authHeaders })
            setShowAdd(false)
            setAddForm({ movie_id: '', auditorium_id: '', projection_type_id: '', start_time: '' })
            setAddErrors({})
            fetchPage()
        } catch (e) {
            console.error(e)
            if (e?.response?.status === 400 && e.response.data) {
                setAddErrors(e.response.data)
            } else {
                setError('Nie udało się dodać seansu')
            }
        }
    }

    const deleteScreening = async (id) => {
        if (!confirm('Usunąć ten seans?')) return
        try {
            await api.delete(`/screenings/${id}/`, { headers: authHeaders })
            fetchPage()
        } catch (e) {
            console.error(e)
            setError('Nie udało się usunąć seansu')
        }
    }

    if (!user || !user.is_staff) {
        return <Navigate to="/" replace />
    }

    return (
        <div className="screenings__container">
            {loading && <Spinner/>}
            <p className="screenings__count">Znaleziono {count} filmów z seansami</p>

            <form className="screenings__filters" onSubmit={(e) => { e.preventDefault(); fetchPage() }}>
                <div className="form_row">
                    <label>Tytuł
                        <input type="text" value={filters.movie_title} onChange={(e) => setFilters(f => ({ ...f, movie_title: e.target.value }))} placeholder="Avatar" />
                    </label>
                    <label>Reżyser
                        <input type="text" value={filters.directors} onChange={(e) => setFilters(f => ({ ...f, directors: e.target.value }))} placeholder="Nolan" />
                    </label>
                    <label>Typ projekcji
                        <input type="text" value={filters.projection_type} onChange={(e) => setFilters(f => ({ ...f, projection_type: e.target.value }))} placeholder="2D" />
                    </label>
                    <label>Sala
                        <select
                            value={filters.auditorium_id}
                            onFocus={fetchAuditoriums}
                            onChange={(e) => setFilters(f => ({ ...f, auditorium_id: e.target.value }))}
                        >
                            <option value="">Wszystkie</option>
                            {auditoriumOptions.map(a => (
                                <option key={a.id} value={a.id}>{a.name || `Sala ${a.id}`}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <div className="form_row">
                    <label>Start po
                        <input type="datetime-local" value={filters.start_after} onChange={(e) => setFilters(f => ({ ...f, start_after: e.target.value }))} />
                    </label>
                    <label>Start przed
                        <input type="datetime-local" value={filters.start_before} onChange={(e) => setFilters(f => ({ ...f, start_before: e.target.value }))} />
                    </label>
                </div>
                <div className="btn_row">
                    <button type="submit" className="btn primary" disabled={loading}>Filtruj</button>
                    <button type="button" className="btn" onClick={() => { setFilters({ movie_title: '', directors: '', auditorium_id: '', projection_type: '', start_after: dayjs().format('YYYY-MM-DDTHH:mm'), start_before: '' }); fetchPage() }}>Wyczyść</button>
                    <button type="button" className="btn success" style={{ marginLeft: 'auto' }} onClick={() => { setShowAdd(true); setAddErrors({}); setError('') }}>Dodaj seans</button>
                </div>
            </form>

            {showAdd && (
                <form className="screenings__card" onSubmit={submitAdd} aria-label="Dodaj seans">
                    <h4 style={{ marginTop: 0 }}>Dodaj nowy seans</h4>
                    {Array.isArray(addErrors?.non_field_errors) && addErrors.non_field_errors.length > 0 && (
                        <div style={{ color: 'var(--danger, #c0392b)', marginBottom: '8px' }}>
                            {addErrors.non_field_errors.join(' ')}
                        </div>
                    )}
                    <div className="form_row">
                        <label>Film
                            <input type="text" list="movies_list" value={addForm.movie_id} onFocus={fetchMovies} onChange={(e) => setAddForm(f => ({ ...f, movie_id: e.target.value }))} placeholder="Wybierz film" required />
                            {Array.isArray(addErrors?.movie_id) && addErrors.movie_id.length > 0 && (
                                <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.movie_id.join(' ')}</div>
                            )}
                            <datalist id="movies_list">
                                {movieOptions.map(m => (
                                    <option key={m.id} value={m.id}>{`${m.title || ''} - ${m.directors || ''}`}</option>
                                ))}
                            </datalist>
                        </label>
                        <label>Numer sali
                            <input
                                type="text"
                                list="auditoriums_list"
                                value={addForm.auditorium_id}
                                onFocus={() => { fetchAuditoriums(); }}
                                onChange={(e) => setAddForm(f => ({ ...f, auditorium_id: e.target.value }))}
                                placeholder="Wybierz salę"
                                required
                            />
                            {Array.isArray(addErrors?.auditorium_id) && addErrors.auditorium_id.length > 0 && (
                                <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.auditorium_id.join(' ')}</div>
                            )}
                            <datalist id="auditoriums_list">
                                {auditoriumOptions.map(a => (
                                    <option key={a.id} value={a.id} label={`${a.id} - ${a.name}`}>
                                        {`${a.id} - ${a.name}`}
                                    </option>
                                ))}
                            </datalist>
                        </label>
                        <label>Typ projekcji
                            <input
                                type="text"
                                list="projection_types_list"
                                value={addForm.projection_type_id}
                                onFocus={fetchProjectionTypes}
                                onChange={(e) => setAddForm(f => ({ ...f, projection_type_id: e.target.value }))}
                                placeholder="Wybierz typ"
                            />
                            {Array.isArray(addErrors?.projection_type_id) && addErrors.projection_type_id.length > 0 && (
                                <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.projection_type_id.join(' ')}</div>
                            )}
                            <datalist id="projection_types_list">
                                {projectionTypeOptions.map(pt => (
                                    <option key={pt.id} value={pt.id} label={pt.name}>{pt.name}</option>
                                ))}
                            </datalist>
                        </label>
                        <label>Start seansu
                            <input type="datetime-local" value={addForm.start_time} onChange={(e) => setAddForm(f => ({ ...f, start_time: e.target.value }))} required />
                            {Array.isArray(addErrors?.start_time) && addErrors.start_time.length > 0 && (
                                <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.start_time.join(' ')}</div>
                            )}
                        </label>
                    </div>
                    <div className="btn_row">
                        <button type="submit" className="btn primary">Dodaj</button>
                        <button type="button" className="btn" onClick={() => setShowAdd(false)}>Anuluj</button>
                    </div>
                </form>
            )}

            {error && <div className="admin__error">{error}</div>}
            {loading && <div className="admin__loading">Ładowanie…</div>}

            {!loading && !error && (
                <div className="screenings__groups">
                    {groups.length === 0 && (
                        <div className="screenings__empty">Brak seansów pasujących do filtrów.</div>
                    )}

                    {groups.map((group, idx) => (
                        <div className="screenings__group" key={idx}>
                            <div className="screenings__movie_header">
                                {group.movie?.poster_path && (
                                    <img className="screenings__poster" src={group.movie.poster_path} alt={group.movie.title} loading="lazy" />
                                )}
                                <div className="screenings__movie_meta">
                                    <h3 className="screenings__movie_title">{group.movie?.title}</h3>
                                    <div className="screenings__movie_sub">{group.movie?.directors || '-'} - {group.movie?.duration_minutes + ' minut' || '-'}</div>
                                </div>
                            </div>

                            <div className="screenings__types">
                                {(group.projection_types || []).map((pt, i) => {
                                    const key = `${idx}-${i}`
                                    const count = Array.isArray(pt.screenings) ? pt.screenings.length : 0
                                    const isOpen = expandedKeys.has(key)
                                    return (
                                        <div className="screenings__type" key={i}>
                                            <div className="screenings__type_title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <h4>{pt.projection_type || '-'}</h4>
                                                <span style={{ color: 'var(--muted, #666)' }}>- {count} seansów</span>
                                                <button type="button" className="btn" onClick={() => toggleExpand(key)}>
                                                    {isOpen ? 'Zwiń' : 'Rozwiń'}
                                                </button>
                                            </div>
                                            {isOpen && (
                                                <div className="screenings__table">
                                                    <div className="screenings__head">
                                                        <div>Seans ID</div>
                                                        <div>Sala</div>
                                                        <div>Start</div>
                                                        <div>Opublikowano</div>
                                                        <div className="screenings__head_actions">Akcje</div>
                                                    </div>

                                                    {(pt.screenings || []).map((s) => (
                                                        <div className="screenings__row" key={s.id}>
                                                            <div>#{s.id}</div>
                                                            <div>{s.auditorium ? `${s.auditorium.id ?? '-'}, ${s.auditorium.name ?? '-'}` : '-'}</div>
                                                            <div>{s.start_time ? dayjs(s.start_time).format('YYYY-MM-DD HH:mm') : '-'}</div>
                                                            <div>{s.published_at ? dayjs(s.published_at).format('YYYY-MM-DD HH:mm') : '-'}</div>
                                                            <div className="btn_row">
                                                                <button type="button" className="btn" onClick={() => startEdit(s)}>Edytuj</button>
                                                                <button type="button" className="btn danger" onClick={() => deleteScreening(s.id)}>Usuń</button>
                                                            </div>

                                                            {editingId === s.id && (
                                                                <form className="screenings__card" onSubmit={submitEdit} aria-label={`Edytuj seans #${s.id}`} style={{ gridColumn: '1 / -1' }}>
                                                                    {Array.isArray(editErrors?.non_field_errors) && editErrors.non_field_errors.length > 0 && (
                                                                        <div style={{ color: 'var(--danger, #c0392b)', marginBottom: '8px' }}>
                                                                            {editErrors.non_field_errors.join(' ')}
                                                                        </div>
                                                                    )}
                                                                    <div className="form_row">
                                                                        <label>Sala ID
                                                                            <input type="number" value={editForm.auditorium_id} onChange={(e) => setEditForm(f => ({ ...f, auditorium_id: e.target.value }))} />
                                                                            {Array.isArray(editErrors?.auditorium_id) && editErrors.auditorium_id.length > 0 && (
                                                                                <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.auditorium_id.join(' ')}</div>
                                                                            )}
                                                                        </label>
                                                                        <label>Typ projekcji ID
                                                                            <input type="number" value={editForm.projection_type_id ?? ''} onChange={(e) => setEditForm(f => ({ ...f, projection_type_id: e.target.value }))} />
                                                                            {Array.isArray(editErrors?.projection_type_id) && editErrors.projection_type_id.length > 0 && (
                                                                                <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.projection_type_id.join(' ')}</div>
                                                                            )}
                                                                        </label>
                                                                        <label>Start seansu
                                                                            <input type="datetime-local" value={editForm.start_time} onChange={(e) => setEditForm(f => ({ ...f, start_time: e.target.value }))} />
                                                                            {Array.isArray(editErrors?.start_time) && editErrors.start_time.length > 0 && (
                                                                                <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.start_time.join(' ')}</div>
                                                                            )}
                                                                        </label>
                                                                    </div>
                                                                    <div className="btn_row">
                                                                        <button type="submit" className="btn primary">Zapisz</button>
                                                                        <button type="button" className="btn" onClick={() => setEditingId(null)}>Anuluj</button>
                                                                    </div>
                                                                </form>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="screenings__pager">
                <button className="btn" disabled={!previous || loading} onClick={() => fetchPage(previous)}>Poprzednia</button>
                <button className="btn" disabled={!next || loading} onClick={() => fetchPage(next)}>Następna</button>
            </div>
        </div>
    )
}

export default ScreeningsPage
