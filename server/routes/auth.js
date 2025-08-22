const express = require('express');
const axios = require('axios');
const router = express.Router();

const {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI
} = process.env;

router.post('/callback', async (req, res) => {
  const { code } = req.body;
  console.log('Received code:', code);

  if (!code) {
    console.error('Missing authorization code');
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;

    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const profile = profileRes.data;
    console.log('LinkedIn user profile:', profile);

    res.json({ user: profile });
  } catch (err) {
    console.error('Auth error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'LinkedIn auth failed' });
  }
});

module.exports = router;
