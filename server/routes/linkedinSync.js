const express = require('express');
const axios = require('axios');
const router = express.Router();
const { poolConnect, sql } = require('../services/db');

// ----- Config from your .env (names left exactly as you have them) -----
const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN; // paste a valid 3-legged token here
const ORG_ENV = process.env.LINKEDIN_ORG_ID;            // you set urn:li:organization:30474
const ORG_URN = ORG_ENV?.startsWith('urn:') ? ORG_ENV : `urn:li:organization:${ORG_ENV}`;
const API_VERSION = process.env.LINKEDIN_VERSION || '202405';
const PAGE_SIZE = parseInt(process.env.LINKEDIN_PAGE_SIZE || '50', 10);

// LinkedIn REST headers
const baseHeaders = {
  Authorization: `Bearer ${ACCESS_TOKEN}`,
  'X-Restli-Protocol-Version': '2.0.0',
  'LinkedIn-Version': API_VERSION,
};

// Axios client
const li = axios.create({
  baseURL: 'https://api.linkedin.com',
  timeout: 20000,
  headers: baseHeaders,
});

// -------------------------- DB helpers --------------------------

async function upsertPost({ postUrn, createdAt, text, url, likeUrns = [], commentUrns = [] }) {
  await poolConnect;

  // Have it? -> update. Else -> insert.
  const check = await new sql.Request()
    .input('linkedin_post_id', sql.NVarChar(200), postUrn)
    .query(`SELECT id FROM Posts WHERE linkedin_post_id = @linkedin_post_id`);

  if (check.recordset.length) {
    const id = check.recordset[0].id;
    await new sql.Request()
      .input('id', sql.Int, id)
      .input('created_at', sql.DateTime2, createdAt)
      .input('text', sql.NVarChar(sql.MAX), text || null)
      .input('url', sql.NVarChar(2000), url || null)
      .input('like_urns', sql.NVarChar(sql.MAX), JSON.stringify(likeUrns))
      .input('comment_urns', sql.NVarChar(sql.MAX), JSON.stringify(commentUrns))
      .query(`
        UPDATE Posts
          SET created_at=@created_at, text=@text, url=@url,
              like_urns=@like_urns, comment_urns=@comment_urns
        WHERE id=@id
      `);
    return id;
  } else {
    const ins = await new sql.Request()
      .input('linkedin_post_id', sql.NVarChar(200), postUrn)
      .input('created_at', sql.DateTime2, createdAt)
      .input('text', sql.NVarChar(sql.MAX), text || null)
      .input('url', sql.NVarChar(2000), url || null)
      .input('like_urns', sql.NVarChar(sql.MAX), JSON.stringify(likeUrns))
      .input('comment_urns', sql.NVarChar(sql.MAX), JSON.stringify(commentUrns))
      .query(`
        INSERT INTO Posts (linkedin_post_id, created_at, text, url, like_urns, comment_urns)
        OUTPUT INSERTED.id
        VALUES (@linkedin_post_id, @created_at, @text, @url, @like_urns, @comment_urns)
      `);
    return ins.recordset[0].id;
  }
}

async function replaceEngagements(postId, engagements) {
  await poolConnect;

  // Simple strategy: delete & bulk insert
  await new sql.Request()
    .input('post_id', sql.Int, postId)
    .query(`DELETE FROM PostEngagements WHERE post_id = @post_id`);

  if (!engagements.length) return;

  const table = new sql.Table('PostEngagements');
  table.create = false;
  table.columns.add('post_id', sql.Int, { nullable: false });
  table.columns.add('user_urn', sql.NVarChar(200), { nullable: false });
  table.columns.add('type', sql.NVarChar(20), { nullable: false });
  table.columns.add('engaged_at', sql.DateTime2, { nullable: true });

  engagements.forEach(e =>
    table.rows.add(postId, e.user_urn, e.type, e.engaged_at || null)
  );

  await new sql.Request().bulk(table);
}

// -------------------------- LinkedIn helpers --------------------------

function postText(ugc) {
  try {
    return ugc.specificContent['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || null;
  } catch {
    return null;
  }
}

function buildPostUrl(/* postUrn */) {
  // optional: resolve activity URL; not needed for scoring
  return null;
}

// -------------------------- Route --------------------------

/**
 * POST /api/linkedin/sync
 * Pull org UGC posts from last 7 days, store posts + likes/comments.
 */
router.post('/sync', async (req, res) => {
  try {
    if (!ACCESS_TOKEN) {
      return res.status(401).json({ error: 'Missing LINKEDIN_ACCESS_TOKEN in env.' });
    }

    const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;

    // Get org UGC posts
    const { data: ugcResp } = await li.get(
      `/rest/ugcPosts`,
      {
        params: {
          q: 'authors',
          authors: `List(${ORG_URN})`,
          count: PAGE_SIZE,
          sortBy: 'LAST_MODIFIED',
        },
      }
    );

    const ugcPosts = (ugcResp?.elements || []).filter(p => {
      const created = p?.created?.time ? Number(p.created.time) : 0;
      return created >= sinceMs;
    });

    let processed = 0;

    for (const ugc of ugcPosts) {
      const postUrn = ugc.id; // e.g., urn:li:ugcPost:123
      const createdAt = ugc.created?.time ? new Date(Number(ugc.created.time)) : new Date();
      const text = postText(ugc);
      const url = buildPostUrl(postUrn);

      const encodedUrn = encodeURIComponent(postUrn);

      // Likes
      const { data: likesData } = await li.get(`/rest/socialActions/${encodedUrn}/likes`, {
        params: { count: 100 },
      });
      const likeActors = (likesData?.elements || []).map(e => e.actor).filter(Boolean);

      // Comments
      const { data: commentsData } = await li.get(`/rest/socialActions/${encodedUrn}/comments`, {
        params: { count: 100 },
      });
      const comments = (commentsData?.elements || []);
      const commentActors = comments.map(c => c.actor).filter(Boolean);

      // Upsert post row
      const postId = await upsertPost({
        postUrn,
        createdAt,
        text,
        url,
        likeUrns: likeActors,
        commentUrns: commentActors,
      });

      // Normalize engagements
      const engagements = [
        ...likeActors.map(a => ({ user_urn: a, type: 'LIKE', engaged_at: null })),
        ...comments.map(c => ({
          user_urn: c.actor,
          type: 'COMMENT',
          engaged_at: c.created?.time ? new Date(Number(c.created.time)) : null,
        })),
      ];

      await replaceEngagements(postId, engagements);
      processed++;
    }

    res.json({ ok: true, processed });
  } catch (err) {
    console.error('LinkedIn sync error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'LinkedIn sync failed' });
  }
});

module.exports = router;
