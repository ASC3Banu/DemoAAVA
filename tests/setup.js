process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_DB = 'logistics_test';
process.env.REDIS_HOST = 'localhost';

jest.setTimeout(10000);

beforeAll(() => {
  console.log('Starting test suite...');
});

afterAll(() => {
  console.log('Test suite completed.');
});