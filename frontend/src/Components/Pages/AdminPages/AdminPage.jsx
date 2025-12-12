import './AdminPage.css'
import { useAuthContext } from '../../../context/Auth.jsx'
import { useEffect } from 'react'
import { useCloudinaryContext } from '../../../context/CloudinaryContext.jsx'
import { Navigate } from 'react-router-dom'
import { useState } from 'react'
import DashboardPage from './DashboardPage/DashboardPage.jsx'
import ScreeningsPage from './ScreeningsPage/ScreeningsPage.jsx'
import MoviesPage from './MoviesPage/MoviesPage.jsx'

const AdminPage = () => {
    const { user } = useAuthContext()
    const { loadCloudinaryConfig } = useCloudinaryContext() || {}
    const [tab, setTab] = useState('dashboard')

    if (!user || !user.is_staff) {
        return <Navigate to="/" replace />
    }

    useEffect(() => {
        // Preload Cloudinary config for admin pages using uploads (e.g., MoviesPage)
        if (typeof loadCloudinaryConfig === 'function') {
            loadCloudinaryConfig().catch(() => { })
        }
    }, [])

    return (
        <div className="admin__container">

            <div className="admin__tabs">
                <button
                    className={`admin__tab_btn ${tab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setTab('dashboard')}
                >Dashboard</button>
                <button
                    className={`admin__tab_btn ${tab === 'seanse' ? 'active' : ''}`}
                    onClick={() => { setTab('seanse') }}
                >Seanse</button>
                <button
                    className={`admin__tab_btn ${tab === 'filmy' ? 'active' : ''}`}
                    onClick={() => setTab('filmy')}
                >Filmy</button>
            </div>

            {tab === 'dashboard' && (
                <div className="admin__cards">
                    <div className="admin__card">
                        <DashboardPage />
                    </div>
                </div>
            )}

            {tab === 'seanse' && (
                <div className="admin__cards">
                    <div className="admin__card">
                        <ScreeningsPage />
                    </div>
                </div>
            )}

            {tab === 'filmy' && (
                <div className="admin__cards">
                    <div className="admin__card">
                        <MoviesPage />
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminPage
