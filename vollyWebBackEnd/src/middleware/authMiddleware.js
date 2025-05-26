const jwt = require('jsonwebtoken');
require('dotenv').config();

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Erişim reddedildi' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Erişim reddedildi' });
    }

    // Ensure decoded token includes client_id, role, and id
    const { id, role, client_id } = decoded;

    if (!id || !role) {
      return res.status(403).json({ message: 'Geçersiz token' });
    }

    req.user = { id, role, client_id: client_id ?? null };
    next();
  });
}

module.exports = authenticateToken;