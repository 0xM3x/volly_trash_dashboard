const mqtt = require('mqtt');
const pool = require('./db');

function setupMQTT(io) {
  const client = mqtt.connect('mqtt://185.184.27.32:1883');

  client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    client.subscribe('trash/sensors', (err) => {
      if (err) {
        console.error('❌ MQTT subscription error:', err);
      } else {
        console.log('📡 Subscribed to trash/sensors');
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📥 MQTT message received:', data);

      // Check if device exists in DB
      const result = await pool.query('SELECT 1 FROM devices WHERE unique_id = $1', [data.id]);

      if (result.rowCount > 0) {
        // Insert into logs
        await pool.query(`
          INSERT INTO sensor_logs (device_id, distance, gas, temperature, current)
          VALUES ($1, $2, $3, $4, $5)
        `, [data.id, data.distance, data.gas, data.temperature, data.current]);

        // Forward to WebSocket clients
        io.emit('sensor-data', data);
      } else {
        console.warn(`[MQTT] Ignored message from unknown device: ${data.id}`);
      }

    } catch (err) {
      console.error('❌ Failed to handle MQTT message:', err.message);
    }
  });
}

module.exports = setupMQTT;
