// context udostępnia dane profilu zalogowanego użytkownika oraz funkcję do ich odświeżania i zapisywania
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/client'
import { useAuthContext } from './Auth'

const ProfileContext = createContext(null)

export const ProfileProvider = ({ children }) => {
    const { isLoggedIn, accessToken } = useAuthContext()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const loadProfile = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const authHeader = accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
            const pRes = await authApi.get('/profile/', { headers: authHeader })
            setProfile(pRes.data)
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
            loading,
            saving,
            error,
            loadProfile,
            updateProfile,
            setError,
        }}>
            {children}
        </ProfileContext.Provider>
    )
}

export const useProfileContext = () => useContext(ProfileContext)
