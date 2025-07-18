const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// POST /api/users - Add new user (admin-only)
router.post('/', authenticateToken, async (req, res) => {
  const { name, email, password, role, client_id } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Tüm alanlar gereklidir' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yetkiniz yok' });
  }

  try {
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, client_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, client_id`,
      [name, email, passwordHash, role, client_id || null]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {

    const allowedRoles = ['admin', 'client_admin', 'client_user'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Kayıt başarısız, bilgileri kontrol edin' });
    }

    if (err.code === '23514') {
      return res.status(400).json({ message: 'Kayıt başarısız, bilgileri kontrol edin' });
    }

    if (err.code === '23505') {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
    }

    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      const result = await pool.query(
        'SELECT id, name, email, role, client_id FROM users ORDER BY id ASC'
      );
      return res.json({ users: result.rows });
    }

    if (req.user.role === 'client_admin') {
      const result = await pool.query(
        'SELECT id, name, email, role, client_id FROM users WHERE client_id = $1 ORDER BY id ASC',
        [req.user.client_id]
      );
      return res.json({ users: result.rows });
    }

    return res.status(403).json({ message: 'Erişim reddedildi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/users/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, u.role, u.client_id, u.created_at, c.name AS client_name FROM users u LEFT JOIN clients c ON u.client_id = c.id WHERE u.id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/users/by-client - List users for the same client (client_admin only)
router.get('/by-client', authenticateToken, async (req, res) => {
  if (req.user.role !== 'client_admin') {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, client_id FROM users WHERE client_id = $1 ORDER BY id ASC',
      [req.user.client_id]
    );
    res.json({ users: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.put('/:id/role', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { role, client_id } = req.body;

  const allowedRoles = ['admin', 'client_admin', 'client_user'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Geçersiz rol' });
  }

  try {
    // Admin can update anyone
    if (req.user.role === 'admin') {
      await pool.query('UPDATE users SET role = $1, client_id = $2 WHERE id = $3', [role, client_id, id]);
      return res.json({ message: 'Rol güncellendi' });
    }

    // Client Admin can only update users in their own company
    if (req.user.role === 'client_admin') {
      const targetUser = await pool.query('SELECT client_id FROM users WHERE id = $1', [id]);
      if (targetUser.rows.length === 0 || targetUser.rows[0].client_id !== req.user.client_id) {
        return res.status(403).json({ message: 'Bu kullanıcıyı değiştiremezsiniz' });
      }

      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
      return res.json({ message: 'Rol güncellendi' });
    }

    return res.status(403).json({ message: 'Erişim reddedildi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.put('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Tüm alanlar gereklidir' });
  }

  try {
    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Eski şifre hatalı' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedNewPassword, req.user.id]);

    res.json({ message: 'Şifre başarıyla güncellendi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});


module.exports = router;
