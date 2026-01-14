import { useEffect, useState, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import './ProfilePage.css'
import { useAuthContext } from '../../../context/Auth'
import { useProfileContext } from '../../../context/ProfileContext'
import { useCloudinaryContext } from '../../../context/CloudinaryContext.jsx'
import defaultAvatar from '../../../assets/default-avatar.png'
import Details from './Details/Details'
import Tickets from './Tickets/Tickets'
import Settings from './Settings/Settings'
import Spinner from "../../../utils/Spinner/Spinner.jsx";

const ProfilePage = () => {
    const [loading, setLoading] = useState(true)
    const { isLoggedIn } = useAuthContext()
    const profileCtx = useProfileContext()
    if (!isLoggedIn) {
        return <Navigate to="/" replace />
    }
    if (!profileCtx) {
        return (
            <div className="profile_container"><div className="profile_card"><p>Ładowanie profilu…</p></div></div>
        )
    }
    const { profile, loading: loadingProfile, saving, error, setError, updateProfile, loadProfile } = profileCtx
    const cloudinary = useCloudinaryContext()
    const fileInputRef = useRef(null)
    const [tab, setTab] = useState('dane')
    const [editingUsername, setEditingUsername] = useState(false)
    const [usernameDraft, setUsernameDraft] = useState('')
    const usernameInputRef = useRef(null)
    const [detailsDraft, setDetailsDraft] = useState({
        first_name: '',
        last_name: '',
        phone: '',
        date_of_birth: '',
        bio: '',
        location_country: '',
        location_city: ''
    })
    const [settingsDraft, setSettingsDraft] = useState({ two_factor_enabled: false })

    useEffect(() => {
        const run = async () => {
            setLoading(true)
            if (isLoggedIn) {
                await loadProfile()
            }
            setLoading(false)
        }
        run()
    }, [isLoggedIn])

    useEffect(() => {
        setUsernameDraft(profile?.username || '')
        setDetailsDraft({
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            phone: profile?.phone || '',
            date_of_birth: profile?.date_of_birth || '',
            bio: profile?.bio || '',
            location_country: profile?.location_country || '',
            location_city: profile?.location_city || ''
        })
        setSettingsDraft({
            two_factor_enabled: !!profile?.two_factor_enabled,
        })
    }, [profile?.username])

    useEffect(() => {
        if (editingUsername && usernameInputRef.current) {
            usernameInputRef.current.focus()
            usernameInputRef.current.select()
        }
    }, [editingUsername])

    const updateField = (key, value) => {
        // Stage locally; only save on handleSave
        if (key === 'username') {
            setUsernameDraft(value)
        } else if (['first_name', 'last_name', 'phone', 'date_of_birth', 'bio', 'location_country', 'location_city'].includes(key)) {
            setDetailsDraft(prev => ({ ...prev, [key]: value }))
        } else if (key === 'two_factor_enabled') {
            setSettingsDraft(prev => ({ ...prev, two_factor_enabled: !!value }))
        }
    }

    const handleSave = async () => {
        try {
            await updateProfile({
                first_name: detailsDraft.first_name || '',
                last_name: detailsDraft.last_name || '',
                phone: detailsDraft.phone || '',
                date_of_birth: detailsDraft.date_of_birth || '',
                bio: detailsDraft.bio || '',
                location_country: detailsDraft.location_country || '',
                location_city: detailsDraft.location_city || '',
                two_factor_enabled: !!settingsDraft.two_factor_enabled,
                avatar: profile?.avatar || '',
                username: usernameDraft || ''
            })
        } catch (e) {
        }
    }

    const handleAvatarUpload = async (file) => {
        try {
            if (!cloudinary) return
            const url = await cloudinary.uploadImageUnsigned(file)
            await updateProfile({ avatar: url })
        } catch (e) {

        } finally {
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const onAvatarChange = (e) => {
        const file = e.target.files?.[0]
        if (file) handleAvatarUpload(file)
    }


    return (
        <div className="profile_container">
            {loading && <Spinner/>}
            <div className="profile_card">
                {error && <div className="profile_error">{error}</div>}
                <div className="profile_body">
                    <aside className="profile_sidebar">
                        <button className={`sidebar_item ${tab === 'dane' ? 'active' : ''}`} onClick={() => setTab('dane')}>Dane</button>
                        <button className={`sidebar_item ${tab === 'bilety' ? 'active' : ''}`} onClick={() => setTab('bilety')}>Bilety</button>
                        <button className={`sidebar_item ${tab === 'ustawienia' ? 'active' : ''}`} onClick={() => setTab('ustawienia')}>Ustawienia</button>
                    </aside>
                    <main className="profile_content">
                        <div className="profile_header">
                            <div className="profile_header_right">
                                <input
                                    type="file"
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={onAvatarChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>

                        {tab === 'dane' && (
                            <Details
                                profile={profile}
                                saving={saving}
                                updateField={updateField}
                                onSave={handleSave}
                                avatarSrc={(profile && profile.avatar) || defaultAvatar}
                                email={profile?.email || ''}
                                usernameDraft={usernameDraft}
                                editingUsername={editingUsername}
                                onStartEditUsername={() => setEditingUsername(true)}
                                onUsernameChange={setUsernameDraft}
                                onUsernameBlur={() => setEditingUsername(false)}
                                usernameInputRef={usernameInputRef}
                                onAvatarClick={() => fileInputRef.current && fileInputRef.current.click()}
                                firstNameDraft={detailsDraft.first_name}
                                lastNameDraft={detailsDraft.last_name}
                                phoneDraft={detailsDraft.phone}
                                dateOfBirthDraft={detailsDraft.date_of_birth}
                                bioDraft={detailsDraft.bio}
                                locationCountryDraft={detailsDraft.location_country}
                                locationCityDraft={detailsDraft.location_city}
                            />
                        )}
                        {tab === 'bilety' && (
                            <Tickets />
                        )}
                        {tab === 'ustawienia' && (
                            <Settings profile={profile} saving={saving} updateField={updateField} onSave={handleSave} twoFactorEnabledDraft={settingsDraft.two_factor_enabled} />
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}

export default ProfilePage
