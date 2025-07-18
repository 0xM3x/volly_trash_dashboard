const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendResetCode } = require('../utils/mailer');
require('dotenv').config();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    const user = result.rows[0];
    const isValid = user ? await bcrypt.compare(password, user.password_hash) : false;

    if (!isValid) {
      return res.status(401).json({ message: 'Kullanıcı bilgileri hatalı' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        client_id: user.client_id // ✅ include client_id explicitly
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Utility to generate a 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Step 1 - Send Code
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: 'Bu e-posta ile kayıtlı bir kullanıcı yok.' });
    }

    const code = generateCode();

    await pool.query(`
      INSERT INTO password_resets (email, code, created_at)
      VALUES ($1, $2, NOW())
    `, [email, code]);


    await sendResetCode(email, code);

    res.json({ message: 'Doğrulama kodu gönderildi.' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Step 2 - Verify Code
router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    const result = await pool.query(`
      SELECT * FROM password_resets
      WHERE email = $1 AND code = $2 AND created_at > NOW() - INTERVAL '3 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `, [email, code]);

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Kod geçersiz veya süresi dolmuş.' });
    }

    res.json({ message: 'Kod doğrulandı.' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Step 3 - Set New Password
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    const result = await pool.query(`
      SELECT * FROM password_resets
      WHERE email = $1 AND code = $2 AND created_at > NOW() - INTERVAL '3 minutes'
      ORDER BY created_at DESC
      LIMIT 1
    `, [email, code]);

    if (result.rowCount === 0) {
      return res.status(400).json({ message: 'Kod geçersiz veya süresi dolmuş.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(`
      UPDATE users SET password_hash = $1 WHERE email = $2
    `, [hashedPassword, email]);

    await pool.query(`DELETE FROM password_resets WHERE email = $1`, [email]);

    res.json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;