const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

const SIM_KEY = process.env.SIMULATION_API_KEY || 'your-simulation-secret';

// ✅ GET /api/notifications - Get all notifications for the user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { id } = req.user;
    const result = await pool.query(
      `SELECT notifications.*, devices.name AS device_name, devices.unique_id
       FROM notifications
       LEFT JOIN devices ON devices.id = notifications.device_id
       WHERE notifications.user_id = $1
       ORDER BY notifications.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ✅ GET /api/notifications/devices - List devices user can enable notifications for
router.get('/devices', authenticateToken, async (req, res) => {
  try {
    const { role, client_id } = req.user;

    let deviceQuery;
    let params = [];

    if (role === 'admin') {
      // Admins can see all devices
      deviceQuery = 'SELECT unique_id, name FROM devices ORDER BY name ASC';
    } else if (role === 'client_admin') {
      // Client-specific devices
      deviceQuery = 'SELECT unique_id, name FROM devices WHERE client_id = $1 ORDER BY name ASC';
      params = [client_id];
    } else {
      return res.status(403).json({ error: 'Yetkisiz erişim' });
    }

    const result = await pool.query(deviceQuery, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ✅ POST /api/notifications/mark-read - Mark all as read
router.post('/mark-read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.user;
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [id]
    );
    res.json({ message: 'Bildirimler okundu olarak işaretlendi' });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// ✅ POST /api/notifications/send-to-device-users
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
      "SELECT id FROM users WHERE role = 'admin'");

    const allRecipients = [...usersRes.rows, ...adminsRes.rows];

    const now = new Date();

    for (const user of allRecipients) {
      await pool.query(
        'INSERT INTO notifications (user_id, message, created_at) VALUES ($1, $2, $3)',
        [user.id, message, now]
      );
    }

    const deviceDetails = await pool.query(
      'SELECT id, name FROM devices WHERE unique_id = $1',
      [device_id]
    );

    const { id: dbDeviceId, name: device_name } = deviceDetails.rows[0];

    if (req.app.get('io')) {
      allRecipients.forEach(user => {
        req.app.get('io').to(user.id.toString()).emit('notification', {
          user_id: user.id,
          message,
          is_read: false,
          created_at: now.toISOString(),
          device_id: dbDeviceId,
          device_name,
        });
      });
    }

    res.status(201).json({ message: `${allRecipients.length} kullanıcıya bildirim gönderildi` });
  } catch (err) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
