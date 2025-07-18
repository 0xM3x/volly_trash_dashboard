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
        const result = await pool.query(
          'SELECT id FROM devices WHERE unique_id = $1',
          [data.id]
        );

        if (result.rowCount > 0) {
          const dbDeviceId = result.rows[0].id;

          await pool.query(`
            INSERT INTO sensor_logs (device_id, distance, gas, temperature, current)
            VALUES ($1, $2, $3, $4, $5)
          `, [dbDeviceId, data.distance, data.gas, data.temperature, data.current]);

          await pool.query(`
            UPDATE devices SET status = 'online', last_seen = NOW()
            WHERE unique_id = $1
          `, [data.id]);

          io.emit('sensor-data', data);
          io.emit('device-status-update', { unique_id: data.id, status: 'online' });
          console.log('📤 sensor-data + device-status-update emitted:', data.id);
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
          'SELECT id, client_id, unique_id, name FROM devices WHERE unique_id = $1',
          [device_id]
        );

        if (deviceResult.rowCount === 0) {
          console.warn('[MQTT] Unknown device for notification:', device_id);
          return;
        }

        const { id: dbDeviceId, client_id: clientId, unique_id, name } = deviceResult.rows[0];

        let newStatus = null;
        if (event === 'full' || event === 'gas_alert') {
          newStatus = 'out_of_service';
        } else if (event === 'empty' || event === 'gas_ok') {
          newStatus = 'online';
        }

        if (newStatus) {
          await pool.query(
            `UPDATE devices SET status = $1, last_seen = NOW() WHERE unique_id = $2`,
            [newStatus, device_id]
          );
          io.emit('device-status-update', { unique_id: device_id, status: newStatus });
        }

        const usersResult = await pool.query(
          'SELECT id FROM users WHERE client_id = $1 OR role = $2',
          [clientId, 'admin']
        );

        const finalMessage = msg || generateDefaultMessage(event, window_open);

        for (const user of usersResult.rows) {
          await pool.query(`
            INSERT INTO notifications (user_id, message, device_id)
            VALUES ($1, $2, $3)
          `, [user.id, finalMessage, dbDeviceId]);

          io.to(user.id.toString()).emit('notification', {
            user_id: user.id, // ✅ needed for frontend matching
            message: finalMessage,
            device_id: dbDeviceId,
            device_name: name,
            type: event,
            unique_id,
            client_id: clientId,
            created_at: new Date().toISOString(),
          });
        }

        console.log(`📤 Notification emitted to ${usersResult.rowCount} users for device ${device_id}`);
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
