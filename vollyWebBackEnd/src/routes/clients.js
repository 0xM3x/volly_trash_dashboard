const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const pool = require('../db');

// POST /api/clients → Create new client (admin only)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }

  const { name } = req.body;

  if (!name) return res.status(400).json({ message: 'İsim gereklidir' });

  try {
    const existing = await pool.query('SELECT 1 FROM clients WHERE name = $1', [name]);
    if (existing.rowCount > 0) {
      return res.status(400).json({ message: 'Bu şirket ismi zaten kayıtlı' });
    }

    const result = await pool.query(`SELECT company_id FROM clients ORDER BY id DESC LIMIT 1`);
    let lastHex = result.rows[0]?.company_id || '000';
    let nextInt = parseInt(lastHex, 16) + 1;

    if (nextInt > 0xFFF) {
      return res.status(400).json({ message: 'Maksimum şirket limiti aşıldı' });
    }

    const nextHex = nextInt.toString(16).toUpperCase().padStart(3, '0');

    const insert = await pool.query(
      `INSERT INTO clients (name, company_id) VALUES ($1, $2) RETURNING *`,
      [name, nextHex]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/clients - Admin only
router.get('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }

  try {
    const result = await pool.query(`SELECT id, name, company_id, created_at FROM clients ORDER BY created_at DESC`);
    res.json({ clients: result.rows });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// GET /api/clients/:id - Admin or Client_Admin of same client
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  if (
    req.user.role !== 'admin' &&
    !(req.user.role === 'client_admin' && parseInt(req.user.client_id) === parseInt(id))
  ) {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }

  try {
    const result = await pool.query('SELECT id, name FROM clients WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Firma bulunamadı' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// PUT /api/clients/:id - Admin or Client_Admin of same client
router.put('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (
    req.user.role !== 'admin' &&
    !(req.user.role === 'client_admin' && parseInt(req.user.client_id) === parseInt(id))
  ) {
    return res.status(403).json({ message: 'Erişim reddedildi' });
  }

  if (!name) {
    return res.status(400).json({ message: 'Firma adı gerekli' });
  }

  try {
    await pool.query('UPDATE clients SET name = $1 WHERE id = $2', [name, id]);
    res.json({ message: 'Firma adı güncellendi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;
