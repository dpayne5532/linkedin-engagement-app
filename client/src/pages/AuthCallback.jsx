import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (!code) return;

    axios.post('/api/auth/callback', { code })
      .then(res => {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        navigate('/');
      })
      .catch(() => {
        alert('Login failed');
        navigate('/login');
      });
  }, [navigate]);

  return <p>Logging you in...</p>;
}
