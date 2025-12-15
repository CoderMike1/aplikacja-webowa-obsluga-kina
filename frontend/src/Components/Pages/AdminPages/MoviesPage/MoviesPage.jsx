import React, { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { api } from '../../../../api/client.js'
import { useAuthContext } from '../../../../context/Auth.jsx'
import { useCloudinaryContext } from '../../../../context/CloudinaryContext.jsx'
import '../AdminPage.css'
import './MoviesPage.css'

const MoviesPage = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [movies, setMovies] = useState([])
  const [nextPage, setNextPage] = useState(null)
  const [prevPage, setPrevPage] = useState(null)
  const [totalCount, setTotalCount] = useState(0)
  const { accessToken, user } = useAuthContext()

  const [filters, setFilters] = useState({
    title: '',
    directors: '',
    is_special_event: '', // '' | 'true' | 'false'
    cinema_after: '', // YYYY-MM-DD
    cinema_before: '',
  })

  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({
    title: '',
    original_title: '',
    description: '',
    release_date: '',
    cinema_release_date: '',
    duration_minutes: '',
    directors: '',
    poster_path: '',
    is_special_event: false,
    genre_ids: '', // comma-separated IDs
  })
  const [addErrors, setAddErrors] = useState({})
  const [addPosterFile, setAddPosterFile] = useState(null)
  const [addPosterPreview, setAddPosterPreview] = useState('')
  const addPosterInputRef = React.useRef(null)

  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    title: '',
    original_title: '',
    description: '',
    release_date: '',
    cinema_release_date: '',
    duration_minutes: '',
    directors: '',
    poster_path: '',
    is_special_event: false,
  })
  const [editErrors, setEditErrors] = useState({})
  const { uploadImageUnsigned, loadCloudinaryConfig } = useCloudinaryContext() || {}
  const editPosterInputRef = React.useRef(null)

  const authHeaders = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  const [currentUrl, setCurrentUrl] = useState(null)

  const fetchMovies = async (url = null) => {
    setLoading(true)
    setError('')
    try {
      let res
      if (url) {
        res = await api.get(url)
      } else {
        // Build params from filters
        const query = {}
        if (filters.title) query.title = filters.title
        if (filters.directors) query.directors = filters.directors
        if (filters.is_special_event) query.is_special_event = filters.is_special_event === 'true'
        if (filters.cinema_after) query.cinema_after = filters.cinema_after
        if (filters.cinema_before) query.cinema_before = filters.cinema_before
        query.page_size = 20
        res = await api.get('/movies/', { params: query })
      }
      if (Array.isArray(res.data)) {
        setMovies(res.data)
        setTotalCount(res.data.length)
        setNextPage(null)
        setPrevPage(null)
      } else {
        setMovies(res.data.results || [])
        setTotalCount(res.data.count || 0)
        setNextPage(res.data.next)
        setPrevPage(res.data.previous)
      }
    } catch (e) {
      console.error(e)
      setError('Nie udało się pobrać listy filmów')
    } finally {
      setLoading(false)
    }
  }



  // No client-side filtering, only backend filtering after 'Filtruj'
  const filteredMovies = movies

  // Fetch initial page like ScreeningsPage
  useEffect(() => {
    fetchMovies()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startEdit = (movie) => {
    setEditingId(movie.id)
    setEditErrors({})
    setError('')
    setEditForm({
      title: movie.title || '',
      original_title: movie.original_title || '',
      description: movie.description || '',
      release_date: movie.release_date || '',
      cinema_release_date: movie.cinema_release_date || '',
      duration_minutes: movie.duration_minutes ?? '',
      directors: movie.directors || '',
      poster_path: movie.poster_path || '',
      is_special_event: !!movie.is_special_event,
    })
  }

  const submitEdit = async (e) => {
    e.preventDefault()
    if (!editingId) return
    setError('')
    try {
      const payload = {
        title: editForm.title,
        original_title: editForm.original_title,
        description: editForm.description,
        release_date: editForm.release_date || null,
        cinema_release_date: editForm.cinema_release_date || null,
        duration_minutes: editForm.duration_minutes ? Number(editForm.duration_minutes) : null,
        directors: editForm.directors,
        poster_path: editForm.poster_path,
        is_special_event: !!editForm.is_special_event,
      }
      await api.patch(`/movies/${editingId}/`, payload, { headers: authHeaders })
      setEditingId(null)
      setEditErrors({})
      fetchMovies()
    } catch (e) {
      console.error(e)
      if (e?.response?.status === 400 && e.response.data) {
        setEditErrors(e.response.data)
      } else {
        setError('Nie udało się zaktualizować filmu')
      }
    }
  }

  const submitAdd = async (e) => {
    e.preventDefault()
    setError('')
    try {
      let posterUrl = addForm.poster_path
      if (addPosterFile && uploadImageUnsigned) {
        if (typeof loadCloudinaryConfig === 'function') {
          try { await loadCloudinaryConfig() } catch { }
        }
        try {
          posterUrl = await uploadImageUnsigned(addPosterFile)
        } catch (e) {
          console.warn('Poster upload failed, falling back to URL field', e)
        }
      }
      const genreIds = (addForm.genre_ids || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
        .map(n => Number(n))
      const payload = {
        title: addForm.title,
        original_title: addForm.original_title,
        description: addForm.description,
        release_date: addForm.release_date || null,
        cinema_release_date: addForm.cinema_release_date || null,
        duration_minutes: addForm.duration_minutes ? Number(addForm.duration_minutes) : null,
        genre_ids: genreIds,
        directors: addForm.directors,
        poster_path: posterUrl || '',
        is_special_event: !!addForm.is_special_event,
      }
      await api.post('/movies/', payload, { headers: authHeaders })
      setShowAdd(false)
      setAddForm({
        title: '', original_title: '', description: '', release_date: '', cinema_release_date: '',
        duration_minutes: '', directors: '', poster_path: '', is_special_event: false, genre_ids: ''
      })
      setAddPosterFile(null)
      setAddPosterPreview('')
      setAddErrors({})
      fetchMovies()
    } catch (e) {
      console.error(e)
      if (e?.response?.status === 400 && e.response.data) {
        setAddErrors(e.response.data)
      } else {
        setError('Nie udało się dodać filmu')
      }
    }
  }

  const onAddPosterChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setAddPosterFile(file)
      try { setAddPosterPreview(URL.createObjectURL(file)) } catch { }
    }
  }

  const deleteMovie = async (id) => {
    if (!confirm('Usunąć ten film?')) return
    setError('')
    try {
      await api.delete(`/movies/${id}/`, { headers: authHeaders })
      fetchMovies()
    } catch (e) {
      console.error(e)
      setError('Nie udało się usunąć filmu')
    }
  }

  if (!user || !user.is_staff) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="movies__container">
      <p className="movies__count">Znaleziono {totalCount} filmów</p>

      <form className="movies__filters" onSubmit={(e) => { e.preventDefault(); fetchMovies(); }}>
        <div className="form_row">
          <label>Tytuł
            <input type="text" value={filters.title} onChange={(e) => setFilters(f => ({ ...f, title: e.target.value }))} placeholder="Avatar" />
          </label>
          <label>Reżyser
            <input type="text" value={filters.directors} onChange={(e) => setFilters(f => ({ ...f, directors: e.target.value }))} placeholder="Nolan" />
          </label>
          <label>Specjalny
            <select value={filters.is_special_event} onChange={(e) => setFilters(f => ({ ...f, is_special_event: e.target.value }))}>
              <option value="">Wszystkie</option>
              <option value="true">Tak</option>
              <option value="false">Nie</option>
            </select>
          </label>
        </div>
        <div className="form_row">
          <label>Premiera kinowa po
            <input type="date" value={filters.cinema_after} onChange={(e) => setFilters(f => ({ ...f, cinema_after: e.target.value }))} />
          </label>
          <label>Premiera kinowa przed
            <input type="date" value={filters.cinema_before} onChange={(e) => setFilters(f => ({ ...f, cinema_before: e.target.value }))} />
          </label>
        </div>
        <div className="btn_row">
          <button type="submit" className="btn primary" disabled={loading}>Filtruj</button>
          <button type="button" className="btn" onClick={() => { setFilters({ title: '', directors: '', is_special_event: '', cinema_after: '', cinema_before: '' }); fetchMovies(); }}>Wyczyść</button>
          <button type="button" className="btn success" style={{ marginLeft: 'auto' }} onClick={() => { setShowAdd(true); setAddErrors({}); setError('') }}>Dodaj film</button>
        </div>
      </form>

      {showAdd && (
        <form className="movies__card" onSubmit={submitAdd} aria-label="Dodaj film">
          <h4 style={{ marginTop: 0 }}>Dodaj nowy film</h4>
          {Array.isArray(addErrors?.non_field_errors) && addErrors.non_field_errors.length > 0 && (
            <div style={{ color: 'var(--danger, #c0392b)', marginBottom: '8px' }}>{addErrors.non_field_errors.join(' ')}</div>
          )}
          <div className="form_row">
            <label>Tytuł
              <input type="text" value={addForm.title} onChange={(e) => setAddForm(f => ({ ...f, title: e.target.value }))} required />
              {Array.isArray(addErrors?.title) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.title.join(' ')}</div>}
            </label>
            <label>Oryginalny tytuł
              <input type="text" value={addForm.original_title} onChange={(e) => setAddForm(f => ({ ...f, original_title: e.target.value }))} required />
              {Array.isArray(addErrors?.original_title) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.original_title.join(' ')}</div>}
            </label>
            <label>Reżyser
              <input type="text" value={addForm.directors} onChange={(e) => setAddForm(f => ({ ...f, directors: e.target.value }))} required />
              {Array.isArray(addErrors?.directors) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.directors.join(' ')}</div>}
            </label>
            <label>Czas trwania (min)
              <input type="number" min="1" value={addForm.duration_minutes} onChange={(e) => setAddForm(f => ({ ...f, duration_minutes: e.target.value }))} required />
              {Array.isArray(addErrors?.duration_minutes) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.duration_minutes.join(' ')}</div>}
            </label>
            <label>Specjalny
              <select value={addForm.is_special_event ? 'true' : 'false'} onChange={(e) => setAddForm(f => ({ ...f, is_special_event: e.target.value === 'true' }))}>
                <option value="false">Nie</option>
                <option value="true">Tak</option>
              </select>
            </label>
          </div>
          <div className="form_row">
            <label>Data premiery
              <input type="date" value={addForm.release_date} onChange={(e) => setAddForm(f => ({ ...f, release_date: e.target.value }))} required />
              {Array.isArray(addErrors?.release_date) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.release_date.join(' ')}</div>}
            </label>
            <label>Premiera kinowa
              <input type="date" value={addForm.cinema_release_date} onChange={(e) => setAddForm(f => ({ ...f, cinema_release_date: e.target.value }))} />
              {Array.isArray(addErrors?.cinema_release_date) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.cinema_release_date.join(' ')}</div>}
            </label>
            <div className="form_field">
              <span>Plakat</span>
              <div className="movies__poster_edit" onClick={(ev) => ev.stopPropagation()}>
                <div>
                  {(addPosterPreview || addForm.poster_path) ? (
                    <img
                      src={addPosterPreview || addForm.poster_path}
                      alt="poster preview"
                      className="movies__poster"
                      style={{ cursor: 'pointer' }}
                      onClick={(ev) => { ev.stopPropagation(); addPosterInputRef.current && addPosterInputRef.current.click() }}
                    />
                  ) : (
                    <button type="button" className="btn" onClick={(ev) => { ev.stopPropagation(); addPosterInputRef.current && addPosterInputRef.current.click() }}>Wybierz plik</button>
                  )}
                  <input type="file" accept="image/*" ref={addPosterInputRef} onChange={onAddPosterChange} style={{ display: 'none' }} />
                </div>
                <div className="movies__poster_tools">
                  <div className="movies__poster_url">
                    <label style={{ color: 'var(--text)' }}>Link do plakatu (URL)</label>
                    <input type="text" value={addForm.poster_path} onChange={(e) => setAddForm(f => ({ ...f, poster_path: e.target.value }))} placeholder="Wklej adres URL plakatu" />
                    <div className="movies__poster_help">Możesz wgrać plik lub podać bezpośredni link.</div>
                  </div>
                  {Array.isArray(addErrors?.poster_path) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.poster_path.join(' ')}</div>}
                </div>
              </div>
            </div>
          </div>
          <div className="form_row">
            <label>Gatunki (ID, po przecinku)
              <input type="text" value={addForm.genre_ids} onChange={(e) => setAddForm(f => ({ ...f, genre_ids: e.target.value }))} placeholder="np. 1,2,3" />
              {Array.isArray(addErrors?.genre_ids) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.genre_ids.join(' ')}</div>}
            </label>
            <label style={{ gridColumn: '2 / -1' }}>Opis
              <textarea rows="6" className="movies__description" value={addForm.description} onChange={(e) => setAddForm(f => ({ ...f, description: e.target.value }))} placeholder="Krótki opis filmu, obsada, fabuła…" />
              {Array.isArray(addErrors?.description) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{addErrors.description.join(' ')}</div>}
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
        <>
          <div className="movies__list">
            {filteredMovies.length === 0 && (
              <div className="movies__empty">Brak filmów pasujących do filtrów.</div>
            )}
            {filteredMovies.map((m) => (
              <div className="movies__card" key={m.id}>
                <div className="movies__header">
                  {m.poster_path && <img className="movies__poster" src={m.poster_path} alt={m.title} />}
                  <div className="movies__meta">
                    <h3 className="movies__title">{m.title}</h3>
                    <div className="movies__sub">{m.directors || '-'}</div>
                    <div className="movies__dates">
                      <span>Premiera: {m.release_date || '-'}</span>
                      <span>Kino: {m.cinema_release_date || '-'}</span>
                      <span>Czas: {m.duration_minutes ?? '-'} min</span>
                    </div>
                  </div>
                </div>

                <div className="btn_row">
                  <button type="button" className="btn" onClick={() => startEdit(m)}>Edytuj</button>
                  <button type="button" className="btn danger" onClick={() => deleteMovie(m.id)}>Usuń</button>
                </div>

                {editingId === m.id && (
                  <form className="movies__card" onSubmit={submitEdit} aria-label={`Edytuj film #${m.id}`} style={{ marginTop: '12px' }}>
                    {Array.isArray(editErrors?.non_field_errors) && editErrors.non_field_errors.length > 0 && (
                      <div style={{ color: 'var(--danger, #c0392b)', marginBottom: '8px' }}>{editErrors.non_field_errors.join(' ')}</div>
                    )}
                    <div className="form_row">
                      <label>Tytuł
                        <input type="text" value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} />
                        {Array.isArray(editErrors?.title) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.title.join(' ')}</div>}
                      </label>
                      <label>Oryginalny tytuł
                        <input type="text" value={editForm.original_title} onChange={(e) => setEditForm(f => ({ ...f, original_title: e.target.value }))} />
                        {Array.isArray(editErrors?.original_title) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.original_title.join(' ')}</div>}
                      </label>
                      <label>Reżyser
                        <input type="text" value={editForm.directors} onChange={(e) => setEditForm(f => ({ ...f, directors: e.target.value }))} />
                        {Array.isArray(editErrors?.directors) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.directors.join(' ')}</div>}
                      </label>
                      <label>Czas trwania (min)
                        <input type="number" min="1" value={editForm.duration_minutes} onChange={(e) => setEditForm(f => ({ ...f, duration_minutes: e.target.value }))} />
                        {Array.isArray(editErrors?.duration_minutes) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.duration_minutes.join(' ')}</div>}
                      </label>
                      <label>Specjalny
                        <select value={editForm.is_special_event ? 'true' : 'false'} onChange={(e) => setEditForm(f => ({ ...f, is_special_event: e.target.value === 'true' }))}>
                          <option value="false">Nie</option>
                          <option value="true">Tak</option>
                        </select>
                      </label>
                    </div>
                    <div className="form_row">
                      <label>Data premiery
                        <input type="date" value={editForm.release_date} onChange={(e) => setEditForm(f => ({ ...f, release_date: e.target.value }))} />
                        {Array.isArray(editErrors?.release_date) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.release_date.join(' ')}</div>}
                      </label>
                      <label>Premiera kinowa
                        <input type="date" value={editForm.cinema_release_date} onChange={(e) => setEditForm(f => ({ ...f, cinema_release_date: e.target.value }))} />
                        {Array.isArray(editErrors?.cinema_release_date) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.cinema_release_date.join(' ')}</div>}
                      </label>
                      <div className="form_field">
                        <span>Plakat</span>
                        <div className="movies__poster_edit" onClick={(ev) => ev.stopPropagation()}>
                          <div>
                            {editForm.poster_path ? (
                              <img
                                src={editForm.poster_path}
                                alt="poster"
                                className="movies__poster"
                                style={{ cursor: 'pointer' }}
                                onClick={(ev) => { ev.stopPropagation(); editPosterInputRef.current && editPosterInputRef.current.click() }}
                              />
                            ) : (
                              <button type="button" className="btn" onClick={(ev) => { ev.stopPropagation(); editPosterInputRef.current && editPosterInputRef.current.click() }}>Wybierz plik</button>
                            )}
                            <input type="file" accept="image/*" ref={editPosterInputRef} onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (file && uploadImageUnsigned) {
                                try {
                                  if (typeof loadCloudinaryConfig === 'function') { try { await loadCloudinaryConfig() } catch { } }
                                  const url = await uploadImageUnsigned(file)
                                  setEditForm(f => ({ ...f, poster_path: url }))
                                } catch (err) {
                                  console.warn('Poster upload failed', err)
                                }
                              }
                            }} style={{ display: 'none' }} />
                          </div>
                          <div className="movies__poster_tools">
                            <div className="movies__poster_url">
                              <label style={{ color: 'var(--text)' }}>Link do plakatu (URL)</label>
                              <input type="text" value={editForm.poster_path} onChange={(e) => setEditForm(f => ({ ...f, poster_path: e.target.value }))} placeholder="Wklej adres URL plakatu" />
                              <div className="movies__poster_help">Możesz wgrać plik lub podać bezpośredni link.</div>
                            </div>
                            {Array.isArray(editErrors?.poster_path) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.poster_path.join(' ')}</div>}
                          </div>
                        </div>
                        {Array.isArray(editErrors?.poster_path) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.poster_path.join(' ')}</div>}
                      </div>
                    </div>
                    <div className="form_row">
                      <label>Opis
                        <textarea rows="6" className="movies__description" value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="Krótki opis filmu, obsada, fabuła…" />
                        {Array.isArray(editErrors?.description) && <div style={{ color: 'var(--danger, #c0392b)', fontSize: '0.85rem' }}>{editErrors.description.join(' ')}</div>}
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
          <div className="screenings__pager">
            <button className="btn" disabled={!prevPage || loading} onClick={() => prevPage && fetchMovies(prevPage)}>Poprzednia</button>
            <button className="btn" disabled={!nextPage || loading} onClick={() => nextPage && fetchMovies(nextPage)}>Następna</button>
          </div>
        </>
      )}
    </div>
  )
}

export default MoviesPage
