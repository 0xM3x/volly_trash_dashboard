const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// GET /api/notification-preferences
router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT device_id FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    const deviceIds = result.rows.map(row => row.device_id);
    res.json({ device_ids: deviceIds });
  } catch (err) {
    console.error('Error fetching notification preferences:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/notification-preferences
router.post('/', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { device_ids } = req.body;

  if (!Array.isArray(device_ids)) {
    return res.status(400).json({ error: 'device_ids bir dizi olmalıdır' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear previous preferences
    await client.query('DELETE FROM notification_preferences WHERE user_id = $1', [userId]);

    // Insert new preferences
    for (const deviceId of device_ids) {
      await client.query(
        'INSERT INTO notification_preferences (user_id, device_id) VALUES ($1, $2)',
        [userId, deviceId]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Tercihler başarıyla güncellendi' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating notification preferences:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  } finally {
    client.release();
  }
});

module.exports = router;
