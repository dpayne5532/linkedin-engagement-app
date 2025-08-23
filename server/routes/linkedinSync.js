const express = require('express');
const axios = require('axios');
const { sql, pool, poolConnect } = require('../services/db');
const { fetchLinkedInPosts } = require('../services/fetchLinkedInPosts');
require('dotenv').config();

const router = express.Router();

const ORG_ID = process.env.LINKEDIN_ORG_ID;
const LINKEDIN_VERSION = process.env.LINKEDIN_VERSION || '202308';
const ORG_URN = ORG_ID.startsWith('urn:') ? ORG_ID : `urn:li:organization:${ORG_ID}`;

// 🔄 Sync LinkedIn engagement data
router.post('/sync', async (req, res) => {
  try {
    await poolConnect;

    const request = pool.request();
    const result = await request
      .input('linkedin_id', sql.NVarChar, 'a5HcScR7vP') // hardcoded admin for now
      .query('SELECT access_token FROM Users WHERE linkedin_id = @linkedin_id');

    if (!result.recordset.length) {
      return res.status(401).json({ error: 'Admin access token not found in DB' });
    }

    const accessToken = result.recordset[0].access_token;

    // Fetch company posts
    const postsRes = await axios.get('https://api.linkedin.com/v2/ugcPosts', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      params: {
        q: 'authors',
        authors: `List(${ORG_URN})`,
        sortBy: 'LAST_MODIFIED',
        count: 10
      }
    });

    const posts = postsRes.data.elements || [];
    console.log(`📣 Found ${posts.length} posts`);

    // Build engagement map
    const engagementMap = {};

    for (const post of posts) {
      const postUrn = post.id;

      // Likes
      const likesRes = await axios.get(`https://api.linkedin.com/v2/socialActions/${postUrn}/likes`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      likesRes.data.elements.forEach(like => {
        const userUrn = like.actor.replace('urn:li:person:', '');
        engagementMap[userUrn] = (engagementMap[userUrn] || 0) + 1;
      });

      // Comments
      const commentsRes = await axios.get(`https://api.linkedin.com/v2/socialActions/${postUrn}/comments`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      commentsRes.data.elements.forEach(comment => {
        const userUrn = comment.actor.replace('urn:li:person:', '');
        engagementMap[userUrn] = (engagementMap[userUrn] || 0) + 3;
      });
    }

    console.log('📊 Engagement Map:', engagementMap);

    // Update Users score
    for (const [linkedinId, score] of Object.entries(engagementMap)) {
      await pool.request()
        .input('linkedin_id', sql.NVarChar, linkedinId)
        .input('score', sql.Int, score)
        .query(`
          UPDATE Users
          SET score = ISNULL(score, 0) + @score
          WHERE linkedin_id = @linkedin_id
        `);
    }

    res.json({ ok: true, processed: Object.keys(engagementMap).length });
  } catch (err) {
    console.error('❌ LinkedIn sync error:', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'LinkedIn sync failed' });
  }
});


// ✅ GET /api/linkedin/posts (returns last 7 days or 10 posts)
router.get('/posts', async (req, res) => {
  try {
    const posts = await fetchLinkedInPosts();
    res.json(posts);
  } catch (err) {
    console.error('❌ Failed to fetch posts:', err?.response?.data || err.message || err);
    res.status(500).json({ error: 'Failed to fetch LinkedIn posts' });
  }
});

module.exports = router;
