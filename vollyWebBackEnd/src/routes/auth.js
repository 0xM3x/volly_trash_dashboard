const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL connection
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

module.exports = router;