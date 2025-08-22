const CLIENT_ID = import.meta.env.VITE_LINKEDIN_CLIENT_ID;
const REDIRECT_URI = 'http://localhost:5173/auth/callback';
const SCOPE = 'openid profile email';

const loginWithLinkedIn = () => {
  const authURL = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPE)}`;
  window.location.href = authURL;
};

export default function Login() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Login</h1>
      <button onClick={loginWithLinkedIn}>Login with LinkedIn</button>
    </div>
  );
}
