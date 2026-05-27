const request = require('supertest');
const app = require('../../src/app');
const { pgPool } = require('../../src/config/database');

describe('Shipment API Integration Tests', () => {
  let authToken;
  let shipmentId;

  beforeAll(async () => {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!',
        first_name: 'Test',
        last_name: 'User'
      });

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123!'
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    await pgPool.query('DELETE FROM users WHERE email = $1', ['test@example.com']);
    await pgPool.end();
  });

  describe('POST /api/v1/shipments', () => {
    it('should create a new shipment', async () => {
      const response = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tracking_number: 'TEST' + Date.now(),
          origin: {
            address: '123 Main St',
            city: 'New York',
            country: 'USA',
            postal_code: '10001'
          },
          destination: {
            address: '456 Oak Ave',
            city: 'Los Angeles',
            country: 'USA',
            postal_code: '90001'
          },
          carrier: 'FedEx',
          estimated_delivery: '2024-12-31T23:59:59Z',
          priority: 'high'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.tracking_number).toBeDefined();
      
      shipmentId = response.body.data.id;
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/shipments')
        .send({
          tracking_number: 'TEST123',
          origin: { city: 'NYC' },
          destination: { city: 'LA' }
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/v1/shipments', () => {
    it('should list shipments with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/shipments?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/shipments/:id', () => {
    it('should get shipment by id', async () => {
      const response = await request(app)
        .get(`/api/v1/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(shipmentId);
    });

    it('should return 404 for non-existent shipment', async () => {
      const response = await request(app)
        .get('/api/v1/shipments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});