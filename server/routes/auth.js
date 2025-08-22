const express = require('express');
const axios = require('axios');
const sql = require('mssql');
const router = express.Router();

const {
  LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI,
  AZURE_SQL_USER,
  AZURE_SQL_PASSWORD,
  AZURE_SQL_SERVER,
  AZURE_SQL_DATABASE
} = process.env;

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
  const { code } = req.body;
  console.log('🔐 Received code:', code);

  if (!code) {
    console.error('⛔ Missing authorization code');
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: LINKEDIN_REDIRECT_URI,
        client_id: LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const accessToken = tokenRes.data.access_token;

    // 2. Fetch user info from LinkedIn
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const profile = profileRes.data;
    console.log('👤 LinkedIn profile:', profile);

    // 3. Connect to Azure SQL
    const pool = await sql.connect(dbConfig);
    const request = pool.request();

    const result = await request
      .input('linkedin_id', sql.NVarChar, profile.sub)
      .input('name', sql.NVarChar, profile.name)
      .input('email', sql.NVarChar, profile.email)
      .input('picture', sql.NVarChar, profile.picture)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE linkedin_id = @linkedin_id)
        BEGIN
          INSERT INTO Users (linkedin_id, name, email, picture)
          VALUES (@linkedin_id, @name, @email, @picture)
        END
      `);

    console.log('✅ SQL rows affected:', result.rowsAffected);

    res.json({ user: profile });

  } catch (err) {
    console.error('❌ Auth error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'LinkedIn auth failed' });
  }
});

module.exports = router;
