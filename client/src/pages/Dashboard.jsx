import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import catLogo from '../assets/catLogo.png';

export default function Dashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }

        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        axios.get('/api/users')
            .then(res => setUsers(res.data))
            .catch(err => {
                console.error('Failed to fetch users:', err);
                alert('Could not load user data');
            });
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const fallbackAvatar = (name) =>
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=100&background=DEE8D8&color=0E2F25`;

    return (
        <div style={{
            backgroundColor: '#EEF3EB',
            minHeight: '100vh',
            padding: '2rem',
            fontFamily: 'sans-serif',
            color: '#0D1A13',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>

            {/* LOGO */}
            <img
                src={catLogo}
                alt="Catalyst Logo"
                style={{ height: '60px', marginBottom: '1rem' }}
            />

            {/* USER PANEL */}
            {user && (
                <div style={{
                    backgroundColor: '#fff',
                    padding: '2rem',
                    borderRadius: '10px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    marginBottom: '2rem',
                    width: '100%',
                    maxWidth: '400px'
                }}>
                    <h2 style={{ color: '#0E2F25', marginBottom: '1rem' }}>👋 Welcome, {user.name}</h2>
                    <img
                        src={user.picture || fallbackAvatar(user.name)}
                        alt={user.name}
                        style={{
                            borderRadius: '50%',
                            width: 100,
                            height: 100,
                            objectFit: 'cover',
                            border: '2px solid #0E2F25',
                            marginBottom: '1rem'
                        }}
                    />
                    <p style={{ color: '#123A2D', marginBottom: '1rem' }}>{user.email}</p>
                    <button
                        onClick={handleLogout}
                        style={{
                            backgroundColor: '#0AEF84',
                            color: '#0D1A13',
                            padding: '0.5rem 1.5rem',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Logout
                    </button>
                </div>
            )}

            {/* LEADERBOARD */}
            <div style={{
                width: '100%',
                maxWidth: '800px'
            }}>
                <h3 style={{ color: '#0E2F25', marginBottom: '1rem' }}>🏆 Engagement Leaderboard</h3>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                    <thead style={{ backgroundColor: '#0E2F25', color: '#EEF3EB' }}>
                        <tr>
                            <th style={{ padding: '0.75rem' }}>#</th>
                            <th>Avatar</th>
                            <th>Name</th>
                            <th>Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, index) => (
                            <tr key={u.linkedin_id} style={{
                                borderBottom: '1px solid #C0D6CA',
                                textAlign: 'center'
                            }}>
                                <td style={{ padding: '0.75rem' }}>{index + 1}</td>
                                <td>
                                    <img
                                        src={u.picture || fallbackAvatar(u.name)}
                                        alt={u.name}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            border: '1px solid #0E2F25'
                                        }}
                                    />
                                </td>
                                <td>{u.name}</td>
                                <td>{u.score ?? 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
