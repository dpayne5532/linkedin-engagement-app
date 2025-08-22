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
    console.log('🧍 Current user:', parsedUser);
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

  return (
    <div style={{
      backgroundColor: '#EEF3EB',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'sans-serif',
      color: '#0D1A13'
    }}>
      {/* LOGO */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <img
          src={catLogo}
          alt="Catalyst Logo"
          style={{ height: '60px', marginBottom: '1rem' }}
        />
      </div>

      {/* USER GREETING */}
      {user && (
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ color: '#0E2F25' }}>👋 Welcome, {user.name}</h2>
          <img
            src={user.picture || 'https://ui-avatars.com/api/?name=No+Image&size=100&background=DEE8D8&color=0E2F25'}
            alt={user.name}
            style={{
              borderRadius: '50%',
              width: 100,
              height: 100,
              objectFit: 'cover',
              backgroundColor: '#fff',
              border: '1px solid #0E2F25'
            }}
          />
          <p style={{ color: '#123A2D', margin: '0.5rem 0' }}>{user.email}</p>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#0AEF84',
              color: '#0D1A13',
              padding: '0.5rem 1.5rem',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Logout
          </button>
        </div>
      )}

      {/* LEADERBOARD */}
      <h3 style={{ color: '#0E2F25' }}>🏆 Engagement Leaderboard</h3>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '1rem',
        backgroundColor: '#DEE8D8',
        borderRadius: '6px',
        overflow: 'hidden'
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
              <td style={{ padding: '0.5rem' }}>{index + 1}</td>
              <td>
                <img
                  src={u.picture || 'https://ui-avatars.com/api/?name=No+Image&size=100&background=DEE8D8&color=0E2F25'}
                  alt={u.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    backgroundColor: '#fff',
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
  );
}
