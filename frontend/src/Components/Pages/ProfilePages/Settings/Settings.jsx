import React, { useState } from 'react'
import './Settings.css'
import { authApi } from '../../../../api/client.js'
import { useAuthContext } from '../../../../context/Auth.jsx'

const Settings = ({ profile, saving, updateField, onSave, twoFactorEnabledDraft }) => {
    const { accessToken } = useAuthContext()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pwdLoading, setPwdLoading] = useState(false)
    const [pwdSuccess, setPwdSuccess] = useState('')
    const [pwdError, setPwdError] = useState('')

    const handleChangePassword = async () => {
        setPwdError('')
        setPwdSuccess('')
        if (!currentPassword || !newPassword) {
            setPwdError('Podaj obecne i nowe hasło.')
            return
        }
        if (newPassword !== confirmPassword) {
            setPwdError('Nowe hasła nie są zgodne.')
            return
        }
        try {
            setPwdLoading(true)
            await authApi.post('/profile/password/', {
                current_password: currentPassword,
                new_password: newPassword,
            }, {
                headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
            })
            setPwdSuccess('Hasło zostało zmienione.')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (e) {
            const data = e?.response?.data || {}

            const messages = []
            const pushMessages = (val) => {
                if (!val) return
                if (Array.isArray(val)) messages.push(...val)
                else if (typeof val === 'string') messages.push(val)
            }
            pushMessages(data.detail)
            pushMessages(data.current_password)
            pushMessages(data.new_password)
            pushMessages(data.non_field_errors)

            Object.keys(data).forEach(k => {
                if (['detail','current_password','new_password','non_field_errors'].includes(k)) return
                const v = data[k]
                if (Array.isArray(v)) messages.push(...v)
            })

            setPwdError(messages.length ? messages.join(' ') : 'Nie udało się zmienić hasła.')
        } finally {
            setPwdLoading(false)
        }
    }

    return (
        <div className="settings_section settings_root">
            <div className="form_group">
                <h3>Zmień hasło</h3>
                {pwdError && <div className="profile_error" style={{ marginBottom: 12 }}>{pwdError}</div>}
                {pwdSuccess && <div className="profile_success" style={{ marginBottom: 12 }}>{pwdSuccess}</div>}
                <div className="form_row">
                    <div className="form_field">
                        <label>Obecne hasło</label>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="form_field">
                        <label>Nowe hasło</label>
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="form_field">
                        <label>Powtórz nowe hasło</label>
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                </div>
                <div className="form_actions">
                    <button className="btn btn-primary" onClick={handleChangePassword} disabled={pwdLoading}>
                        {pwdLoading ? 'Zapisywanie…' : 'Zmień hasło'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Settings
