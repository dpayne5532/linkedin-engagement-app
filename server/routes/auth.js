const express = require('express');
const axios = require('axios');
const sql = require('mssql');
const router = express.Router();

// Load environment variables
const {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI,
  AZURE_SQL_USER,
  AZURE_SQL_PASSWORD,
  AZURE_SQL_SERVER,
  AZURE_SQL_DATABASE
} = process.env;

// Azure SQL config
const dbConfig = {
  user: AZURE_SQL_USER,
  password: AZURE_SQL_PASSWORD,
  server: AZURE_SQL_SERVER,
  database: AZURE_SQL_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

router.post('/callback', async (req, res) => {
  console.log('🔥 /api/auth/callback hit');

  const { code } = req.body;
  console.log('📥 Code received:', code);

  if (!code) {
    console.error('❌ Missing LinkedIn code');
    return res.status(400).json({ error: 'Missing LinkedIn authorization code' });
  }

  try {
    // Exchange code for access token
    console.log('📡 Requesting LinkedIn access token...');
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
    console.log('🔑 LinkedIn access token received:', accessToken);

    // Fetch LinkedIn profile
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const profile = profileRes.data;
    console.log('🧠 LinkedIn profile:', profile);

    // Save user and access token to SQL
    await sql.connect(dbConfig);
    const request = new sql.Request();

    await request
      .input('linkedin_id', sql.NVarChar, profile.sub)
      .input('name', sql.NVarChar, profile.name)
      .input('email', sql.NVarChar, profile.email)
      .input('picture', sql.NVarChar, profile.picture)
      .input('token', sql.NVarChar, accessToken)
      .query(`
        IF EXISTS (SELECT 1 FROM Users WHERE linkedin_id = @linkedin_id)
          UPDATE Users
          SET name = @name, email = @email, picture = @picture, access_token = @token
          WHERE linkedin_id = @linkedin_id
        ELSE
          INSERT INTO Users (linkedin_id, name, email, picture, access_token)
          VALUES (@linkedin_id, @name, @email, @picture, @token)
      `);

    console.log('✅ User inserted or updated');

    res.json({ user: profile });
  } catch (err) {
    console.error('❌ Auth error:', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'LinkedIn auth failed' });
  }
});

module.exports = router;
