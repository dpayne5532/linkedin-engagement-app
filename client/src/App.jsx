import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [status, setStatus] = useState('');

  useEffect(() => {
    axios.get('/api/health')
      .then(res => setStatus(res.data.status))
      .catch(err => setStatus('Failed to connect to backend.'));
  }, []);

  return (
    <div style={{ backgroundColor: '#EEF3EB', height: '100vh', padding: '2rem' }}>
      <h1 style={{ color: '#0E2F25' }}>LinkedIn Leaderboard</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;
