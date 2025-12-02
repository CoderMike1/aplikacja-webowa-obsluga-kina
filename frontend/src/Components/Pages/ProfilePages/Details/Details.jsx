import React from 'react'
import './Details.css'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

const Details = ({
    profile,
    saving,
    updateField,
    onSave,
    avatarSrc,
    email,
    usernameDraft,
    editingUsername,
    onStartEditUsername,
    onUsernameChange,
    onUsernameBlur,
    usernameInputRef,
    onAvatarClick,
    firstNameDraft,
    lastNameDraft,
    phoneDraft,
    dateOfBirthDraft,
    bioDraft,
    locationCountryDraft,
    locationCityDraft,
}) => {
    return (
        <div className="profile_form details_form">
            <div className="profile_header">
                <div className="profile_header_left">
                    <img
                        src={avatarSrc}
                        alt={profile?.username || 'avatar'}
                        className="profile_avatar"
                        onClick={onAvatarClick}
                    />
                    <div className="profile_header_info">
                        {editingUsername ? (
                            <div className="username_edit_group">
                                <div className="form_field" style={{ maxWidth: '300px' }}>
                                    <label>Nazwa użytkownika</label>
                                    <input
                                        type="text"
                                        value={usernameDraft}
                                        onChange={e => onUsernameChange(e.target.value)}
                                        onBlur={onUsernameBlur}
                                        ref={usernameInputRef}
                                    />
                                </div>
                            </div>
                        ) : (
                            <h4
                                className="profile_username"
                                title="Kliknij, aby edytować"
                                onClick={onStartEditUsername}
                            >{(usernameDraft && usernameDraft.length > 0) ? usernameDraft : (profile?.username || '')}</h4>
                        )}
                        <p>{email || ''}</p>
                    </div>
                </div>
            </div>
            <div className="form_row">
                <div className="form_field">
                    <label>Imię</label>
                    <input
                        type="text"
                        value={typeof firstNameDraft !== 'undefined' ? firstNameDraft : (profile?.first_name || '')}
                        onChange={e => updateField('first_name', e.target.value)}
                    />
                </div>
                <div className="form_field">
                    <label>Nazwisko</label>
                    <input
                        type="text"
                        value={typeof lastNameDraft !== 'undefined' ? lastNameDraft : (profile?.last_name || '')}
                        onChange={e => updateField('last_name', e.target.value)}
                    />
                </div>
            </div>

            <div className="form_row">
                <div className="form_field">
                    <label>Telefon</label>
                    <input
                        type="tel"
                        value={typeof phoneDraft !== 'undefined' ? phoneDraft : (profile?.phone || '')}
                        onChange={e => updateField('phone', e.target.value)}
                    />
                </div>
            </div>

            <div className="form_row">
                <div className="form_field">
                    <label>Data urodzenia</label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                            value={dateOfBirthDraft ? dayjs(dateOfBirthDraft) : (profile?.date_of_birth ? dayjs(profile.date_of_birth) : null)}
                            onChange={(val) => updateField('date_of_birth', val ? val.format('YYYY-MM-DD') : '')}
                            format="DD.MM.YYYY"
                            className="date_picker"
                            slotProps={{
                                textField: {
                                    variant: 'outlined',
                                    fullWidth: true,
                                }
                            }}
                        />
                    </LocalizationProvider>
                </div>
                <div className="form_field">
                    <label>Kraj</label>
                    <input
                        type="text"
                        value={typeof locationCountryDraft !== 'undefined' ? locationCountryDraft : (profile?.location_country || '')}
                        onChange={e => updateField('location_country', e.target.value)}
                    />
                </div>
            </div>

            <div className="form_row">
                <div className="form_field">
                    <label>Miasto</label>
                    <input
                        type="text"
                        value={typeof locationCityDraft !== 'undefined' ? locationCityDraft : (profile?.location_city || '')}
                        onChange={e => updateField('location_city', e.target.value)}
                    />
                </div>
            </div>

            <div className="form_row">
                <div className="form_field">
                    <label>Bio</label>
                    <textarea
                        rows={4}
                        value={typeof bioDraft !== 'undefined' ? bioDraft : (profile?.bio || '')}
                        onChange={e => updateField('bio', e.target.value)}
                        style={{ resize: 'vertical' }}
                    />
                </div>
            </div>

            <div className="form_actions">
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>Zapisz zmiany</button>
            </div>
        </div>
    )
}

export default Details
