const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken  = require('../middleware/authMiddleware');
const axios = require('axios');
require('dotenv').config();

// GET /api/devices - List all or client-specific devices
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `SELECT id, name, unique_id, board_mac, status, client_id, created_at FROM devices`;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ` WHERE client_id = $1`;
      params.push(req.user.client_id);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, params);
    res.json({ devices: result.rows });
  } catch (err) {
    console.error('Device list error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/devices - Admin-only device registration
router.post('/', authenticateToken, async (req, res) => {
  const { name, board_mac, client_id, latitude, longitude } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yetkiniz yok' });
  }

  if (!name || !board_mac || !client_id || !latitude || !longitude) {
    return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
  }

  try {
    const macCheck = await pool.query('SELECT 1 FROM devices WHERE board_mac = $1', [board_mac]);
    if (macCheck.rowCount > 0) {
      return res.status(400).json({ message: 'Bu kart zaten kayıtlı' });
    }

    const lastDevice = await pool.query(
      'SELECT unique_id FROM devices WHERE client_id = $1 ORDER BY unique_id DESC LIMIT 1',
      [client_id]
    );

    let nextId = '001';
    if (lastDevice.rows.length > 0) {
      const lastHex = parseInt(lastDevice.rows[0].unique_id, 16);
      nextId = (lastHex + 1).toString(16).padStart(3, '0').toUpperCase();
    }

    const result = await pool.query(
       `INSERT INTO devices (name, unique_id, board_mac, client_id, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, unique_id, board_mac, status, client_id, latitude, longitude, created_at`,
      [name, nextId, board_mac, client_id, latitude, longitude]
    );

    res.status(201).json({ device: result.rows[0] });
  } catch (err) {
    console.error('Device registration error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/devices/map - Get locations of all devices (no fullness)
router.get('/map', authenticateToken, async (req, res) => {
  try {
    let query = `
      SELECT d.id, d.unique_id, d.name, d.latitude, d.longitude, d.client_id, d.status
      FROM devices d
      WHERE d.latitude IS NOT NULL AND d.longitude IS NOT NULL
    `;
    const params = [];

    if (req.user.role === 'client_admin' || req.user.role === 'client_user') {
      query += ` AND d.client_id = $1`;
      params.push(req.user.client_id);
    }

    const result = await pool.query(query, params);
    res.json({ devices: result.rows });
  } catch (err) {
    console.error('Map devices fetch error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// POST /api/devices/route - Route optimization with optional start point
router.post('/route', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'client_user') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const clientId = req.user.client_id;
    const start = req.body.start;

    const result = await pool.query(`
      SELECT d.id, d.name, d.latitude, d.longitude
      FROM devices d
      WHERE d.client_id = $1
        AND d.latitude IS NOT NULL AND d.longitude IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM notifications f
          WHERE f.device_id = d.id AND f.message = 'Çöp kutusu dolu'
          AND f.created_at > COALESCE((
            SELECT e.created_at FROM notifications e
            WHERE e.device_id = d.id AND e.message = 'Çöp kutusu boş'
            ORDER BY e.created_at DESC LIMIT 1
          ), '1970-01-01')
        )
    `, [clientId]);

    let coords = result.rows.map(row => [parseFloat(row.longitude), parseFloat(row.latitude)]);

    if (start && start.lat && start.lng) {
      coords = [[parseFloat(start.lng), parseFloat(start.lat)], ...coords];
    }

    if (coords.length < 2) {
      return res.status(400).json({ message: 'Toplanacak yeterli çöp kutusu yok' });
    }

    const orsResponse = await axios.post(
      'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
      {
        coordinates: coords,
        instructions: false,
      },
      {
        headers: {
          Authorization: process.env.ORS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    res.json({
      route: orsResponse.data,
      devices: result.rows,
    });
  } catch (err) {
    console.error('Route optimization error:', err.message);
    res.status(500).json({ message: 'Rota oluşturulurken hata oluştu' });
  }
});

// GET /api/devices/:id - Get specific device info
router.get('/:id', async (req, res) => {
  const deviceId = req.params.id;

  try {
    const query = 'SELECT * FROM devices WHERE id = $1';
    const result = await pool.query(query, [deviceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    const device = result.rows[0];

    if (req.user.role !== 'admin' && device.client_id !== req.user.client_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(device);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
