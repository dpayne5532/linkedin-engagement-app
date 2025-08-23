const express = require('express');
const router = express.Router();
const { poolConnect, sql } = require('../services/db');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const request = new sql.Request();
    const result = await request.query('SELECT * FROM Users');

    res.json(result.recordset);
  } catch (err) {
    console.error('❌ Failed to fetch users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
