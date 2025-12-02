import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'
import { useAuthContext } from './Auth'

const ProfileContext = createContext(null)

export const ProfileProvider = ({ children }) => {
    const { isLoggedIn, accessToken } = useAuthContext()
    const [profile, setProfile] = useState(null)
    const [cloudinary, setCloudinary] = useState({ cloud_name: '', upload_preset: '', allowed_domain: '' })
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const loadProfile = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
            const [pRes, cRes] = await Promise.all([
                authApi.get('/profile/', { headers: authHeader }),
                authApi.get('/profile/avatar/config/', { headers: authHeader })
            ])
            setProfile(pRes.data)
            setCloudinary(cRes.data)
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || 'Nie udało się pobrać profilu'
            setError(msg)
        } finally {
            setLoading(false)
        }
    }, [accessToken])

    const updateProfile = useCallback(async (payload) => {
        setSaving(true)
        setError('')
        try {
            const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
            const res = await authApi.patch('/profile/', payload, { headers: authHeader })
            setProfile(res.data)
            return res.data
        } catch (e) {
            const msg = e?.response?.data?.detail || e?.message || 'Nie udało się zapisać zmian'
            setError(msg)
            throw e
        } finally {
            setSaving(false)
        }
    }, [accessToken])

    const uploadAvatarUnsigned = useCallback(async (file) => {
        if (!file || !cloudinary.cloud_name || !cloudinary.upload_preset) {
            setError('Brak konfiguracji przesyłania lub pliku')
            return
        }
        setSaving(true)
        setError('')
        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('upload_preset', cloudinary.upload_preset)
            const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinary.cloud_name}/image/upload`
            const res = await fetch(uploadUrl, { method: 'POST', body: formData })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error?.message || 'Nie udało się przesłać zdjęcia')
            }
            const secureUrl = data.secure_url
            const updated = await updateProfile({ avatar: secureUrl })
            return updated
        } catch (e) {
            const msg = e?.message || 'Błąd podczas przesyłania zdjęcia'
            setError(msg)
            throw e
        } finally {
            setSaving(false)
        }
    }, [cloudinary, updateProfile])

    useEffect(() => {
        if (isLoggedIn) {
            loadProfile()
        } else {
            setProfile(null)
        }
    }, [isLoggedIn, loadProfile])

    return (
        <ProfileContext.Provider value={{
            profile,
            cloudinary,
            loading,
            saving,
            error,
            loadProfile,
            updateProfile,
            uploadAvatarUnsigned,
            setError,
        }}>
            {children}
        </ProfileContext.Provider>
    )
}

export const useProfileContext = () => useContext(ProfileContext)
