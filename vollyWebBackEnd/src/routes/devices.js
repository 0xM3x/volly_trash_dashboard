const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken  = require('../middleware/authMiddleware');

// GET /api/devices - List all or client-specific devices
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = `SELECT id, name, unique_id, board_mac, status, client_id, created_at FROM devices`;
    const params = [];

    // Filter devices if not admin
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
  const { name, board_mac, client_id } = req.body;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yetkiniz yok' });
  }

  if (!name || !board_mac || !client_id) {
    return res.status(400).json({ message: 'Tüm alanlar zorunludur' });
  }

  try {
    // Check for existing MAC address
    const macCheck = await pool.query('SELECT 1 FROM devices WHERE board_mac = $1', [board_mac]);
    if (macCheck.rowCount > 0) {
      return res.status(400).json({ message: 'Bu kart zaten kayıtlı' });
    }

    // Generate next unique_id for this client
    const lastDevice = await pool.query(
      'SELECT unique_id FROM devices WHERE client_id = $1 ORDER BY unique_id DESC LIMIT 1',
      [client_id]
    );

    let nextId = '001';
    if (lastDevice.rows.length > 0) {
      const lastHex = parseInt(lastDevice.rows[0].unique_id, 16);
      nextId = (lastHex + 1).toString(16).padStart(3, '0').toUpperCase();
    }

    // Insert new device
    const result = await pool.query(
      `INSERT INTO devices (name, unique_id, board_mac, client_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, unique_id, board_mac, status, client_id, created_at`,
      [name, nextId, board_mac, client_id]
    );

    res.status(201).json({ device: result.rows[0] });
  } catch (err) {
    console.error('Device registration error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});


// GET /api/devices/:id - Get specific device info
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT id, name, unique_id, board_mac, status, client_id, created_at FROM devices WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Cihaz bulunamadı' });
    }

    // Optional: restrict to owner
    if (req.user.role !== 'admin' && result.rows[0].client_id !== req.user.client_id) {
      return res.status(403).json({ message: 'Erişim reddedildi' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Cihaz bilgisi alma hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});


module.exports = router;
