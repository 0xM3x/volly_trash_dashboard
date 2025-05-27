const mqtt = require('mqtt');
const axios = require('axios');

const client = mqtt.connect('mqtt://185.184.27.32:1883');
let counter = 0;

client.on('connect', () => {
  console.log('🧪 Simulator connected to MQTT broker');

  setInterval(async () => {
    const mockData = {
      id: '001', // unique_id of device in DB
      distance: Math.floor(Math.random() * 100),
      temperature: 20 + Math.random() * 10,
      gas: Math.floor(Math.random() * 1000),
      current: Math.floor(2500 + Math.random() * 1000)
    };

    // Publish fake data to MQTT
    client.publish('trash/sensors', JSON.stringify(mockData));
    console.log('🚀 Published fake sensor data:', mockData);

    counter++;

    // Every 3rd message, send a simulated notification
    if (counter % 5 === 0) {
      try {
        await axios.post(
          'http://localhost:8000/api/notifications/send-to-device-users',
          {
            device_id: mockData.id,
            message: `Simülasyon: Cihaz ${mockData.id} bildirimi. Mesafe: ${mockData.distance}cm`
          },
          {
            headers: {
              'x-api-key': 'your-simulation-secret' // Must match SIMULATION_API_KEY in .env
            }
          }
        );
        console.log('🔔 Simulated notification sent to related users');
      } catch (err) {
        console.error('❌ Notification error:', err.response?.data || err.message);
      }
    }
  }, 5000);
});
