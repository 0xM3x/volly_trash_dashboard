const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app'); // ✅ Make sure this is the Express app, not the server
const pool = require('../src/db');

let adminToken;
let userToken;
let createdDeviceId;

beforeAll(() => {
  adminToken = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  userToken = jwt.sign({ id: 2, role: 'client_user', client_id: 1000 }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  if (createdDeviceId) {
    await pool.query('DELETE FROM devices WHERE id = $1', [createdDeviceId]);
  }
  await pool.end();
});

describe('GET /api/devices', () => {
  it('✅ should return devices for admin', async () => {
    const res = await request(app)
      .get('/api/devices')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.devices)).toBe(true);
  });

  it('❌ should block request without token', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/devices', () => {
  it('✅ should allow admin to create device', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Device ' + Math.random(),
        board_mac: 'AA:BB:' + Math.floor(Math.random() * 1000000),
        client_id: 1000,
        latitude: 41.015,
        longitude: 28.979,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.device).toHaveProperty('id');
    createdDeviceId = res.body.device.id; // Save for later tests
  });

  it('❌ should block non-admin from creating device', async () => {
    const res = await request(app)
      .post('/api/devices')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Unauthorized Device',
        board_mac: 'XX:YY:' + Math.floor(Math.random() * 1000000),
        client_id: 1000,
        latitude: 41.0,
        longitude: 29.0,
      });

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/devices/:id', () => {
  it('✅ should return specific device for admin', async () => {
    const res = await request(app)
      .get(`/api/devices/${createdDeviceId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('id', createdDeviceId);
  });

  it('❌ should block client_user from another client', async () => {
    const res = await request(app)
      .get(`/api/devices/${createdDeviceId}`)
      .set('Authorization', `Bearer ${jwt.sign({ id: 3, role: 'client_user', client_id: 999 }, process.env.JWT_SECRET)}`);

    expect(res.statusCode).toBe(403);
  });
});

describe('GET /api/devices/map', () => {
  it('✅ should return device locations', async () => {
    const res = await request(app)
      .get('/api/devices/map')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.devices)).toBe(true);
  });
});

describe('POST /api/devices/route', () => {
  it('✅ should return route optimization if full bins exist', async () => {
    const res = await request(app)
      .post('/api/devices/route')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ start: { lat: 41.015, lng: 28.979 } });

    // Status 200 if there are full devices in notifications
    if (res.statusCode === 200) {
      expect(res.body).toHaveProperty('route');
    } else {
      expect(res.statusCode).toBe(400); // not enough full bins
    }
  });

  it('❌ should block non-client_user role', async () => {
    const res = await request(app)
      .post('/api/devices/route')
      .set('Authorization', `Bearer ${adminToken}`) // Not allowed
      .send({});

    expect(res.statusCode).toBe(403);
  });
});
