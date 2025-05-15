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
    console.error('User registration error:', err);

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

// GET /api/users - List all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }

  try {
    const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY id ASC');
    res.json({ users: result.rows });
  } catch (err) {
    console.error('Kullanıcıları alma hatası:', err);
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

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }

  const { id } = req.params;
  const { role } = req.body;

  const allowedRoles = ['admin', 'client_admin', 'client_user'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Geçersiz rol' });
  }

  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, id]);
    res.json({ message: 'Rol başarıyla güncellendi' });
  } catch (err) {
    console.error('Rol güncelleme hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
