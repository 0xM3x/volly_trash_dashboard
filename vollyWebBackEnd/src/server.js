const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const setupMQTT = require('./mqttHandler');
const pool = require('./db');

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io); // Make WebSocket instance available to routes
setupMQTT(io);

async function deleteOldResetCodes() {
  try {
    await pool.query(`
      DELETE FROM password_resets
      WHERE created_at < NOW() - INTERVAL '3 minutes'
    `);
    console.log('🧼 Old password reset codes cleaned up');
  } catch (err) {
    console.error('❌ Error cleaning password reset codes:', err.message);
  }
}
setInterval(deleteOldResetCodes, 60 * 1000);

io.on('connection', (socket) => {
  console.log('⚡ WebSocket client connected');

  socket.on('register', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`📡 User registered for notifications: ${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket client disconnected');
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
