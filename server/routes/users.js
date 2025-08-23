const express = require('express');
const router = express.Router();
const { poolConnect, sql, pool } = require('../services/db'); // 🟢 Add `pool`

// GET /api/users
router.get('/', async (req, res) => {
  try {
    await poolConnect; // Ensure DB is connected
    const request = pool.request(); // ✅ Use the active pool connection
    const result = await request.query('SELECT * FROM Users');

    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Failed to fetch users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
