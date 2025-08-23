const axios = require('axios');
const { pool, sql } = require('./db');
require('dotenv').config();

const ORG_ID = process.env.LINKEDIN_ORG_ID;
const ORG_URN = ORG_ID.startsWith('urn:') ? ORG_ID : `urn:li:organization:${ORG_ID}`;

// This is the CORRECT format for the LinkedIn query
// Docs: https://learn.microsoft.com/en-us/linkedin/marketing/integrations/community-management/shares/ugc-post-api

async function fetchLinkedInPosts() {
  try {
    const result = await pool.request()
      .input('linkedin_id', sql.NVarChar, 'a5HcScR7vP') // Admin LinkedIn ID
      .query('SELECT access_token FROM Users WHERE linkedin_id = @linkedin_id');

    if (!result.recordset.length) throw new Error('Access token not found in DB');

    const accessToken = result.recordset[0].access_token;

    const params = {
      q: 'authors',
      authors: `List(${ORG_URN})`, // ✅ CORRECT
      sortBy: 'LAST_MODIFIED',
      count: 10
    };

    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0'
    };

    console.log('📤 Fetching posts with params:', params);

    const response = await axios.get('https://api.linkedin.com/rest/posts', {
      headers,
      params
    });

    const posts = response.data.elements || [];
    console.log(`✅ Retrieved ${posts.length} posts`);
    return posts;
  } catch (err) {
    console.error('❌ Failed to fetch posts:', err?.response?.data || err.message || err);
    throw new Error('Failed to fetch LinkedIn posts');
  }
}

module.exports = { fetchLinkedInPosts };
