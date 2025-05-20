const mqtt = require('mqtt');

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

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📥 MQTT message received:', data);
      io.emit('sensor-data', data); // Forward to WebSocket clients
    } catch (err) {
      console.error('❌ Failed to parse MQTT message:', err.message);
    }
  });
}

module.exports = setupMQTT;
