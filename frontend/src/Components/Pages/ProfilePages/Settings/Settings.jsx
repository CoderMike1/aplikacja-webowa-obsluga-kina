import React from 'react'
import './Settings.css'

const Settings = ({ profile, saving, updateField, onSave, twoFactorEnabledDraft }) => {
    return (
        <div className="settings_section settings_root">
            <div className="form_row">
                <div className="form_field form_switch">
                    <label>2FA</label>
                    <input
                        type="checkbox"
                        checked={!!twoFactorEnabledDraft}
                        onChange={e => updateField('two_factor_enabled', e.target.checked)}
                    />
                </div>
            </div>
            <p>Tutaj dodamy np. zmianę hasła.</p>
            <div className="form_actions">
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>Zapisz ustawienia</button>
            </div>
        </div>
    )
}

export default Settings
