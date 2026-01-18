// context udostępnia konfigurację Cloudinary i funkcję do uploadu obrazów
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'
import { useAuthContext } from './Auth'

const CloudinaryContext = createContext(null)

export const CloudinaryProvider = ({ children }) => {
    const { isLoggedIn, accessToken } = useAuthContext()
    const [config, setConfig] = useState({ cloud_name: '', upload_preset: '', allowed_domain: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const loadCloudinaryConfig = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
            const res = await authApi.get('/profile/avatar/config/', { headers })
            setConfig(res.data)
            return res.data
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || 'Nie udało się pobrać konfiguracji Cloudinary'
            setError(msg)
            throw e
        } finally {
            setLoading(false)
        }
    }, [accessToken])

    const uploadImageUnsigned = useCallback(async (file) => {
        if (!file) throw new Error('Brak pliku')
        const { cloud_name, upload_preset } = config
        if (!cloud_name || !upload_preset) {
            await loadCloudinaryConfig()
        }
        const cn = config.cloud_name
        const preset = config.upload_preset
        if (!cn || !preset) throw new Error('Brak konfiguracji przesyłania')
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', preset)
            const uploadUrl = `https://api.cloudinary.com/v1_1/${cn}/image/upload`
            const res = await fetch(uploadUrl, { method: 'POST', body: formData })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error?.message || 'Nie udało się przesłać zdjęcia')
            }
            return data.secure_url
        } catch (e) {
            const msg = e?.message || 'Błąd podczas przesyłania zdjęcia'
            setError(msg)
            throw e
        }
    }, [config, loadCloudinaryConfig])

    useEffect(() => {
        if (isLoggedIn) {
            loadCloudinaryConfig().catch(() => { })
        }
    }, [isLoggedIn, loadCloudinaryConfig])

    return (
        <CloudinaryContext.Provider value={{ config, loading, error, loadCloudinaryConfig, uploadImageUnsigned, setError }}>
            {children}
        </CloudinaryContext.Provider>
    )
}

export const useCloudinaryContext = () => useContext(CloudinaryContext)
