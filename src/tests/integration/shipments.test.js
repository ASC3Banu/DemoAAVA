const request = require('supertest');
const app = require('../../app');
const { sequelize } = require('../../config/database');

describe('Shipments API Integration Tests', () => {
  let authToken;
  let shipmentId;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/v1/shipments', () => {
    it('should create a new shipment', async () => {
      const shipmentData = {
        tracking_number: 'TEST123456',
        origin: {
          address: '123 Main St',
          city: 'New York',
          country: 'US',
          postal_code: '10001'
        },
        destination: {
          address: '456 Oak Ave',
          city: 'Los Angeles',
          country: 'US',
          postal_code: '90001'
        },
        transport_mode: 'air',
        carrier_id: '123e4567-e89b-12d3-a456-426614174000',
        estimated_delivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        cargo_details: {
          weight: 100,
          description: 'Test cargo'
        }
      };

      const response = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shipmentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.tracking_number).toBe('TEST123456');
      shipmentId = response.body.data.id;
    });
  });

  describe('GET /api/v1/shipments/:id', () => {
    it('should retrieve a shipment by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/shipments/${shipmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(shipmentId);
    });

    it('should return 404 for non-existent shipment', async () => {
      const response = await request(app)
        .get('/api/v1/shipments/123e4567-e89b-12d3-a456-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.error).toBe('Shipment not found');
    });
  });
});