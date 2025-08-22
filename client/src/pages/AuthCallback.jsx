import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      alert('Missing LinkedIn authorization code');
      return;
    }

    // Exchange code for tokens + user info
    axios.post('/api/auth/callback', { code })
      .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data));
        navigate('/dashboard');
      })
      .catch(err => {
        console.error('Auth error:', err);
        alert('Login failed');
      });
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', paddingTop: '5rem' }}>
      <h2>Authenticating with LinkedIn...</h2>
    </div>
  );
}
