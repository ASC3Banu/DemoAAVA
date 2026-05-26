const request = require('supertest');
const app = require('../../app');
const database = require('../../configs/database.config');

describe('Alert API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    await database.connect();
    authToken = 'Bearer test-jwt-token';
  });

  afterAll(async () => {
    await database.disconnect();
  });

  describe('GET /api/v1/alerts', () => {
    it('should retrieve active alerts', async () => {
      const response = await request(app)
        .get('/api/v1/alerts')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter alerts by severity', async () => {
      const response = await request(app)
        .get('/api/v1/alerts')
        .query({ severity: 'critical' })
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.data.every(alert => alert.severity === 'critical')).toBe(true);
    });
  });
});
