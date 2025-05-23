const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// Helper to filter by client_id if not admin
const getClientFilter = (user) => {
  if (user.role === 'admin') return { where: '', params: [] };
  return { where: 'WHERE client_id = $1', params: [user.client_id] };
};

// GET /api/stats/summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const filter = getClientFilter(req.user);
    const total = await pool.query(`SELECT COUNT(*) FROM devices ${filter.where}`, filter.params);
    const online = await pool.query(`SELECT COUNT(*) FROM devices ${filter.where ? filter.where + ' AND' : 'WHERE'} status = 'online'`, filter.params);
    const offline = await pool.query(`SELECT COUNT(*) FROM devices ${filter.where ? filter.where + ' AND' : 'WHERE'} status = 'offline'`, filter.params);
    const outOfService = await pool.query(`SELECT COUNT(*) FROM devices ${filter.where ? filter.where + ' AND' : 'WHERE'} status = 'out_of_service'`, filter.params);

    res.json({
      total: parseInt(total.rows[0].count),
      online: parseInt(online.rows[0].count),
      offline: parseInt(offline.rows[0].count),
      outOfService: parseInt(outOfService.rows[0].count),
    });
  } catch (err) {
    console.error('Summary stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/fill-graph
router.get('/fill-graph', authenticateToken, async (req, res) => {
  try {
    const filter = getClientFilter(req.user);
    const baseQuery = `SELECT device_id, timestamp, distance FROM sensor_logs WHERE timestamp >= NOW() - INTERVAL '7 days'`;
    const logs = await pool.query(
      req.user.role === 'admin'
        ? baseQuery
        : `${baseQuery} AND device_id IN (SELECT unique_id FROM devices ${filter.where})`,
      filter.params
    );

    const fillCounts = {};
    const dateMap = {};
    const deviceFillCount = {};

    logs.rows.forEach(log => {
      const date = new Date(log.timestamp);
      const key = date.toLocaleDateString('tr-TR');
      if (!dateMap[key]) dateMap[key] = 0;
      if (log.distance <= 25) dateMap[key] += 1;

      if (!deviceFillCount[log.device_id]) deviceFillCount[log.device_id] = 0;
      if (log.distance <= 25) deviceFillCount[log.device_id]++;
    });

    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('tr-TR');
    });

    const counts = days.map(day => dateMap[day] || 0);

    const sortedDevices = Object.entries(deviceFillCount).sort((a, b) => b[1] - a[1]);
    const mostFilled = sortedDevices[0] || [];
    const leastFilled = sortedDevices[sortedDevices.length - 1] || [];

    const getName = async (id) => {
      const q = await pool.query('SELECT name FROM devices WHERE unique_id = $1', [id]);
      return q.rows[0]?.name || id;
    };

    res.json({
      days,
      counts,
      mostFilled: mostFilled.length ? { name: await getName(mostFilled[0]), count: mostFilled[1] } : null,
      leastFilled: leastFilled.length ? { name: await getName(leastFilled[0]), count: leastFilled[1] } : null,
    });
  } catch (err) {
    console.error('Fill graph stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/latest-status
router.get('/latest-status', authenticateToken, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const params = isAdmin ? [] : [req.user.client_id];

    const query = `
      SELECT d.name, d.unique_id, sl.distance, sl.timestamp
      FROM devices d
      LEFT JOIN (
        SELECT DISTINCT ON (device_id) *
        FROM sensor_logs
        ORDER BY device_id, timestamp DESC
      ) sl ON sl.device_id = d.unique_id
      ${isAdmin ? '' : 'WHERE d.client_id = $1'}
      ORDER BY d.created_at DESC
    `;

    const devices = await pool.query(query, params);

    const result = devices.rows.map(row => {
      const percent = row.distance != null
        ? Math.max(0, Math.min(100, Math.round(((85 - row.distance) / 60) * 100)))
        : 0;

      return {
        name: row.name,
        percent,
        time: row.timestamp
          ? new Date(row.timestamp).toLocaleDateString('tr-TR') + ' - ' + new Date(row.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '—',
      };
    });

    res.json(result);
  } catch (err) {
    console.error('Latest status error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;
