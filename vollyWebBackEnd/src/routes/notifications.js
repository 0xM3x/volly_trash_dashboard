// src/routes/notifications.js

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

const SIM_KEY = process.env.SIMULATION_API_KEY || 'your-simulation-secret';

// GET /api/notifications - Get all notifications for the user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/notifications/mark-read - Mark all as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.user;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [id]
    );
    res.json({ message: 'Bildirimler okundu olarak işaretlendi' });
  } catch (err) {
    console.error('Error updating notifications:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// POST /api/notifications/send-to-device-users
router.post('/send-to-device-users', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== SIM_KEY) {
    return res.status(401).json({ error: 'Yetkisiz istek' });
  }

  const { device_id, message } = req.body;
  if (!device_id || !message) {
    return res.status(400).json({ error: 'Cihaz ID ve mesaj zorunludur.' });
  }

  try {
    const deviceRes = await pool.query(
      'SELECT client_id FROM devices WHERE unique_id = $1',
      [device_id]
    );

    if (deviceRes.rowCount === 0) {
      return res.status(404).json({ error: 'Cihaz bulunamadı' });
    }

    const clientId = deviceRes.rows[0].client_id;

    const usersRes = await pool.query(
      'SELECT id FROM users WHERE client_id = $1',
      [clientId]
    );

    const adminsRes = await pool.query(
      "SELECT id FROM users WHERE role = 'admin'"
    );

    const allRecipients = [...usersRes.rows, ...adminsRes.rows];

    const now = new Date();

    for (const user of allRecipients) {
      await pool.query(
        'INSERT INTO notifications (user_id, message, created_at) VALUES ($1, $2, $3)',
        [user.id, message, now]
      );
    }

    if (req.app.get('io')) {
      allRecipients.forEach(user => {
        req.app.get('io').to(user.id.toString()).emit('notification', {
          user_id: user.id,
          message,
          is_read: false,
          created_at: now.toISOString(),
        });
      });
    }

    res.status(201).json({ message: `${allRecipients.length} kullanıcıya bildirim gönderildi` });
  } catch (err) {
    console.error('Bildirim gönderme hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
