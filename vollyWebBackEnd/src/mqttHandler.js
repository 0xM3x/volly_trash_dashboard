const mqtt = require('mqtt');
const pool = require('./db');

function setupMQTT(io) {
  const client = mqtt.connect('mqtt://185.184.27.32:1883');

  client.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    client.subscribe(['trash/sensors', 'trash/notifications'], (err) => {
      if (err) {
        console.error('❌ MQTT subscription error:', err);
      } else {
        console.log('📡 Subscribed to trash/sensors and trash/notifications');
      }
    });
  });

  client.on('message', async (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📥 MQTT message received on topic', topic, ':', data);

      if (topic === 'trash/sensors') {
        const result = await pool.query('SELECT 1 FROM devices WHERE unique_id = $1', [data.id]);

        if (result.rowCount > 0) {
          await pool.query(`
            INSERT INTO sensor_logs (device_id, distance, gas, temperature, current)
            VALUES ($1, $2, $3, $4, $5)
          `, [data.id, data.distance, data.gas, data.temperature, data.current]);

          io.emit('sensor-data', data);
        } else {
          console.warn('[MQTT] Ignored sensor message from unknown device:', data.id);
        }

      } else if (topic === 'trash/notifications') {
        const { device_id, event, message: msg, window_open } = data;

        if (!device_id || !event) {
          console.warn('[MQTT] Invalid notification payload:', data);
          return;
        }

        const deviceResult = await pool.query(
          'SELECT client_id, unique_id FROM devices WHERE unique_id = $1',
          [device_id]
        );


        if (deviceResult.rowCount === 0) {
          console.warn('[MQTT] Unknown device for notification:', device_id);
          return;
        }

        const clientId = deviceResult.rows[0].client_id;
        const usersResult = await pool.query('SELECT id FROM users WHERE client_id = $1', [clientId]);

        const finalMessage = msg || generateDefaultMessage(event, window_open);

        for (const user of usersResult.rows) {
          await pool.query(`
            INSERT INTO notifications (user_id, message, device_id)
            VALUES ($1, $2, $3)
          `, [user.id, finalMessage, device_id]);

          io.to(user.id.toString()).emit('notification', {
            message: finalMessage,
            type: event,
            unique_id: deviceResult.rows[0].unique_id,
            created_at: new Date(),
          });
        }
        console.log(`🔔 Notification saved and sent to users of client ${clientId}: ${finalMessage}`);
      }

    } catch (err) {
      console.error('❌ Failed to handle MQTT message:', err.message);
    }
  });
}

function generateDefaultMessage(event, window_open) {
  switch (event) {
    case 'full': return 'Çöp kutusu dolu';
    case 'empty': return 'Çöp kutusu boş';
    case 'press_active': return 'Presleme işlemi çalışıyor';
    case 'press_stop': return 'Pres durdu';
    case 'gas_alert': return 'Gaz seviyesi yüksek!';
    case 'gas_ok': return 'Gaz seviyesi normal';
    case 'door_open': return 'Kapak açıldı';
    case 'door_close': return 'Kapak kapandı';
    case 'window_open': return 'Pencere açık';
    case 'window_close': return 'Pencere kapandı';
    default: return 'Yeni bildirim';
  }
}


module.exports = setupMQTT;
