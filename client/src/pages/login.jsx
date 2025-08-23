import catLogo from '../assets/catLogo.png';

const CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:5173/auth/callback';
const SCOPE = 'openid profile email';

const loginWithLinkedIn = () => {
  const authURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;
  window.location.href = authURL;
};

export default function Login() {
  return (
    <div style={{
      backgroundColor: '#EEF3EB',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'sans-serif',
      color: '#0D1A13',
      padding: '2rem',
      textAlign: 'center'
    }}>
      {/* Catalyst Logo */}
      <img
        src={catLogo}
        alt="Catalyst Logo"
        style={{ height: '70px', marginBottom: '2rem' }}
      />

      {/* Welcome Message */}
      <h1 style={{
        color: '#0E2F25',
        fontSize: '2rem',
        marginBottom: '0.5rem'
      }}>
        Welcome to Catalyst
      </h1>

      <p style={{
        color: '#123A2D',
        fontSize: '1.1rem',
        maxWidth: '400px',
        marginBottom: '2rem'
      }}>
        Join the Catalyst leaderboard to see how your LinkedIn activity ranks with the team.
      </p>

      {/* LinkedIn Login Button */}
      <button
        onClick={loginWithLinkedIn}
        style={{
          backgroundColor: '#0AEF84',
          color: '#0D1A13',
          border: 'none',
          borderRadius: '6px',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0CEB78'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0AEF84'}
      >
        <img
          src="https://static.licdn.com/scds/common/u/images/logos/favicons/v1/favicon.ico"
          alt="LinkedIn"
          style={{ width: '20px', height: '20px' }}
        />
        Sign in with LinkedIn
      </button>
    </div>
  );
}
