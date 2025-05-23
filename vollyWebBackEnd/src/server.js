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


app.get('/', (req, res) => {
  res.send('Volly Backend Running');
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'connected', time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// ✅ New logic starts here
const http = require('http');
const { Server } = require('socket.io');
const setupMQTT = require('./mqttHandler');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

setupMQTT(io);

io.on('connection', (socket) => {
  console.log('⚡ WebSocket client connected');
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

