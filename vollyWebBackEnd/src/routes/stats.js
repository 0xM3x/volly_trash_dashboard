const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// GET /api/stats/summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { role, client_id } = req.user;
    console.log('[SUMMARY] Authenticated user:', req.user);

    let baseQuery = 'SELECT status, COUNT(*) FROM devices';
    const params = [];

    if (role !== 'admin') {
      baseQuery += ' WHERE client_id = $1';
      params.push(client_id);
    }

    baseQuery += ' GROUP BY status';

    const result = await pool.query(baseQuery, params);

    const summary = {
      total: 0,
      online: 0,
      offline: 0,
      outOfService: 0,
    };

    result.rows.forEach((row) => {
      summary.total += parseInt(row.count);
      if (row.status === 'online') summary.online = parseInt(row.count);
      if (row.status === 'offline') summary.offline = parseInt(row.count);
      if (row.status === 'out_of_service') summary.outOfService = parseInt(row.count);
    });

    res.json(summary);
  } catch (err) {
    console.error('Summary stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/fill-graph
router.get('/fill-graph', authenticateToken, async (req, res) => {
  try {
    const { role, client_id } = req.user;

    const deviceQuery = role === 'admin'
      ? 'SELECT id, name FROM devices'
      : 'SELECT id, name FROM devices WHERE client_id = $1';

    const devices = await pool.query(deviceQuery, role === 'admin' ? [] : [client_id]);

    const deviceMap = {};
    const allowedIds = [];

    devices.rows.forEach(d => {
      deviceMap[d.id] = d.name;
      allowedIds.push(d.id);
    });

    console.log('[FILL-GRAPH] Allowed device IDs:', allowedIds);

    if (allowedIds.length === 0) {
      return res.json({ days: [], counts: [], mostFilled: null, leastFilled: null });
    }

    const logs = await pool.query(
      `SELECT device_id, timestamp, distance
       FROM sensor_logs
       WHERE timestamp >= NOW() - INTERVAL '7 days'
       AND distance <= 25
       AND device_id = ANY($1::int[])`,
      [allowedIds]
    );

    const dailyCount = {};
    const deviceCount = {};

    logs.rows.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('en-GB');
      dailyCount[date] = (dailyCount[date] || 0) + 1;
      deviceCount[log.device_id] = (deviceCount[log.device_id] || 0) + 1;
    });

    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-GB');
    });

    const counts = days.map(day => dailyCount[day] || 0);
    const sortedDevices = Object.entries(deviceCount).sort((a, b) => b[1] - a[1]);

    const mostFilled = sortedDevices[0] || [null, 0];
    const leastFilled = sortedDevices[sortedDevices.length - 1] || [null, 0];

    res.json({
      days,
      counts,
      mostFilled: {
        name: deviceMap[mostFilled[0]] || mostFilled[0],
        count: mostFilled[1],
      },
      leastFilled: {
        name: deviceMap[leastFilled[0]] || leastFilled[0],
        count: leastFilled[1],
      },
    });
  } catch (err) {
    console.error('Fill graph stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/stats/latest-status
router.get('/latest-status', authenticateToken, async (req, res) => {
  try {
    const { role, client_id } = req.user;
    const deviceQuery = role === 'admin'
      ? 'SELECT id, unique_id, name FROM devices'
      : 'SELECT id, unique_id, name FROM devices WHERE client_id = $1';
    const devices = await pool.query(deviceQuery, role === 'admin' ? [] : [client_id]);

    const deviceMap = {};
    const allowedIds = [];
    devices.rows.forEach(d => {
      deviceMap[d.id] = { unique_id: d.unique_id, name: d.name };
      allowedIds.push(d.id);
    });
    console.log('[LATEST-STATUS] Allowed device IDs:', allowedIds);

    if (allowedIds.length === 0) return res.json([]);

    const logs = await pool.query(
      `SELECT DISTINCT ON (device_id) device_id, distance
       FROM sensor_logs
       WHERE device_id = ANY($1::int[])
       ORDER BY device_id, timestamp DESC`,
      [allowedIds]
    );

    console.log('[LATEST-STATUS] Queried logs:', logs.rows);

    const enriched = logs.rows
      .filter(log => deviceMap[log.device_id])
      .map(log => ({
        id: log.device_id,
        unique_id: deviceMap[log.device_id]?.unique_id || null,
        name: deviceMap[log.device_id]?.name || 'Unknown',
        distance: log.distance,
      }));

    res.json(enriched);
  } catch (err) {
    console.error('Latest status stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
