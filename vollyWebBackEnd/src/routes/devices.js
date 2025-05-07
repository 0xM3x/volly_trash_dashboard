const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// GET /api/devices - List all or client-specific devices
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `SELECT id, name, unique_id, status, client_id, created_at FROM devices`;
    let values = [];

    // If not admin, filter by client_id
    if (req.user.role !== 'admin') {
      query += ` WHERE client_id = $1`;
      values.push(req.user.clientId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);
    res.json({ devices: result.rows });
  } catch (err) {
    console.error('Device list error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
