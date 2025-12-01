import React, { useState } from 'react';
import './ProfilePage.css';

const ProfilePage = () => {
    const [user, setUser] = useState({
        name: 'Jan Kowalski',
        email: 'jan.kowalski@example.com',
        phone: '+48 123 456 789',
        memberSince: '2023-01-15'
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = () => {
        setIsEditing(false);
        // Tutaj można dodać logikę zapisu do API
    };

    const handleChange = (e) => {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                <h1>Mój Profil</h1>
                
                <div className="profile-section">
                    <div className="profile-avatar">
                        <div className="avatar-circle">
                            {user.name.charAt(0)}
                        </div>
                    </div>

                    <div className="profile-info">
                        <div className="info-group">
                            <label>Imię i nazwisko:</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name="name"
                                    value={user.name}
                                    onChange={handleChange}
                                />
                            ) : (
                                <p>{user.name}</p>
                            )}
                        </div>

                        <div className="info-group">
                            <label>Email:</label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={user.email}
                                    onChange={handleChange}
                                />
                            ) : (
                                <p>{user.email}</p>
                            )}
                        </div>

                        <div className="info-group">
                            <label>Telefon:</label>
                            {isEditing ? (
                                <input
                                    type="tel"
                                    name="phone"
                                    value={user.phone}
                                    onChange={handleChange}
                                />
                            ) : (
                                <p>{user.phone}</p>
                            )}
                        </div>

                        <div className="info-group">
                            <label>Członek od:</label>
                            <p>{new Date(user.memberSince).toLocaleDateString('pl-PL')}</p>
                        </div>
                    </div>

                    <div className="profile-actions">
                        {isEditing ? (
                            <>
                                <button className="btn-save" onClick={handleSave}>
                                    Zapisz
                                </button>
                                <button className="btn-cancel" onClick={handleEdit}>
                                    Anuluj
                                </button>
                            </>
                        ) : (
                            <button className="btn-edit" onClick={handleEdit}>
                                Edytuj profil
                            </button>
                        )}
                    </div>
                </div>

                <div className="profile-stats">
                    <div className="stat-card">
                        <h3>15</h3>
                        <p>Obejrzane filmy</p>
                    </div>
                    <div className="stat-card">
                        <h3>3</h3>
                        <p>Aktywne rezerwacje</p>
                    </div>
                    <div className="stat-card">
                        <h3>250</h3>
                        <p>Punkty lojalnościowe</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;