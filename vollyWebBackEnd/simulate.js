const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://185.184.27.32:1883');

client.on('connect', () => {
  console.log('🧪 Simulator connected to MQTT broker');

  setInterval(() => {
    const mockData = {
      id: 'esp32_test',
      distance: Math.floor(Math.random() * 100),
      temperature: (20 + Math.random() * 10).toFixed(1),
      gas: Math.floor(Math.random() * 1000),
      current: Math.floor(2500 + Math.random() * 1000)
    };
    client.publish('trash/sensors', JSON.stringify(mockData));
    console.log('🚀 Published fake sensor data:', mockData);
  }, 1000);
});
