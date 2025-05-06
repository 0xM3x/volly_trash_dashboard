const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    message: 'Profil verisi',
    user: req.user, // id, role, clientId
  });
});

module.exports = router;

