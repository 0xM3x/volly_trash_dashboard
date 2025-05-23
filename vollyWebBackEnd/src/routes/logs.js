const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/logs/:deviceId?date=YYYY-MM-DD
router.get('/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: 'Date query parameter is required (YYYY-MM-DD)' });
  }

  try {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const result = await pool.query(
      `SELECT timestamp, distance, gas, temperature, current
       FROM sensor_logs
       WHERE device_id = $1 AND timestamp >= $2 AND timestamp < $3
       ORDER BY timestamp ASC`,
      [deviceId, start.toISOString(), end.toISOString()]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch logs by date:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/logs/:deviceId/range?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
router.get('/:deviceId/range', async (req, res) => {
  const { deviceId } = req.params;
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ error: 'start_date and end_date query parameters are required' });
  }

  try {
    const start = new Date(start_date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(end_date);
    end.setDate(end.getDate() + 1);

    const result = await pool.query(
      `SELECT timestamp, distance, gas, temperature, current
       FROM sensor_logs
       WHERE device_id = $1 AND timestamp >= $2 AND timestamp < $3
       ORDER BY timestamp ASC`,
      [deviceId, start.toISOString(), end.toISOString()]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Failed to fetch logs in range:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
