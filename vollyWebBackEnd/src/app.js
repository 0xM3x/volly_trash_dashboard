const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pool = require('./db');
const authenticateToken = require('./middleware/authMiddleware');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const deviceRoutes = require('./routes/devices');
const logRoutes = require('./routes/logs');
const statsRoutes = require('./routes/stats');
const notificationRoutes = require('./routes/notifications');
const notificationPreferencesRoutes = require('./routes/notificationPreferences');

dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/devices', authenticateToken, deviceRoutes);
app.use('/api/logs', authenticateToken, logRoutes);
app.use('/api/stats', authenticateToken, statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notification-preferences', notificationPreferencesRoutes);

app.get('/', (req, res) => {
  res.send('Volly Backend Running');
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'connected', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

module.exports = app;
