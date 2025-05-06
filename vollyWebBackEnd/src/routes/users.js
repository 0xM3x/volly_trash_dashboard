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

  // Only allow admins to create users
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Yetkiniz yok' });
  }

  try {
    // Check if email already exists
    const existing = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, client_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, client_id`,
      [name, email, passwordHash, role, client_id || null]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
		  console.error('User registration error:', err);

			const allowedRoles = ['admin', 'client_user'];
			if (!allowedRoles.includes(role)) {
			  return res.status(400).json({ message: 'Kayıt başarısız, bilgileri kontrol edin' });
			}

  		// PostgreSQL constraint violation for invalid enum/check values
  		if (err.code === '23514') {
  		  return res.status(400).json({ message: 'Kayıt başarısız, bilgileri kontrol edin' });
  		}

  		// Unique email constraint
  		if (err.code === '23505') {
  		  return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı' });
  		}

  		res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;

