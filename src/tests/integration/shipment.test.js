const request = require('supertest');
const app = require('../../app');
const database = require('../../configs/database.config');

describe('Shipment API Integration Tests', () => {
  let authToken;
  let testShipmentId;

  beforeAll(async () => {
    await database.connect();
    authToken = 'Bearer test-jwt-token';
  });

  afterAll(async () => {
    await database.disconnect();
  });

  describe('POST /api/v1/shipments', () => {
    it('should create a new shipment', async () => {
      const shipmentData = {
        tracking_number: `TEST${Date.now()}`,
        origin_location: 'New York, NY, USA',
        destination_location: 'London, UK',
        transport_mode: 'air',
        carrier_id: 'CARRIER001',
        cargo_details: {
          weight: 100,
          value: 5000
        }
      };

      const response = await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', authToken)
        .send(shipmentData)
        .expect(201);

      expect(response.body).toHaveProperty('shipment_id');
      expect(response.body.tracking_number).toBe(shipmentData.tracking_number);
      testShipmentId = response.body.shipment_id;
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        tracking_number: 'TEST'
      };

      await request(app)
        .post('/api/v1/shipments')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);
    });
  });

  describe('GET /api/v1/shipments/:shipment_id', () => {
    it('should retrieve shipment details', async () => {
      const response = await request(app)
        .get(`/api/v1/shipments/${testShipmentId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('shipment_id');
      expect(response.body.shipment_id).toBe(testShipmentId);
    });

    it('should return 404 for non-existent shipment', async () => {
      await request(app)
        .get('/api/v1/shipments/nonexistent-id')
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('GET /api/v1/shipments', () => {
    it('should search shipments', async () => {
      const response = await request(app)
        .get('/api/v1/shipments')
        .query({ status: 'created', limit: 10 })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
