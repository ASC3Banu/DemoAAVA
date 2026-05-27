# Logistics Monitoring System

AI-Powered Logistics Monitoring System with Real-time Tracking, Event Management, and Predictive Analytics.

## Features

- **Real-time Shipment Tracking**: Track shipments across global supply chains
- **Event Management**: Comprehensive event logging with time-series data
- **Alert System**: Multi-severity alerts with assignment and resolution tracking
- **AI/ML Predictions**: Estimated arrival times and delay probability forecasting
- **Analytics Dashboard**: Performance metrics and KPI visualization
- **Webhook Integration**: Real-time notifications to external systems
- **RBAC**: Role-based access control with granular permissions
- **Audit Logging**: Complete audit trail for compliance
- **Data Lineage**: Track all data changes for regulatory requirements

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (Primary), InfluxDB (Time-Series)
- **Cache**: Redis
- **Message Queue**: Apache Kafka
- **Authentication**: JWT with OAuth 2.0
- **Security**: AES-256 encryption, TLS 1.3, Helmet.js
- **Monitoring**: Prometheus, Winston
- **Testing**: Jest, Supertest

## Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 7
- Apache Kafka >= 3.0
- InfluxDB >= 2.0 (optional)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd logistics-monitoring-system

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
nano .env

# Run database migrations
npm run db:migrate

# Start the server
npm start
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:unit
npm run test:integration

# Lint code
npm run lint
npm run lint:fix
```

## API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication

#### Register
```bash
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "company": "ACME Corp"
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### Shipments

#### Create Shipment
```bash
POST /shipments
Authorization: Bearer <token>
Content-Type: application/json

{
  "tracking_number": "SHIP123456",
  "origin": {
    "address": "123 Main St",
    "city": "New York",
    "country": "USA",
    "postal_code": "10001"
  },
  "destination": {
    "address": "456 Oak Ave",
    "city": "Los Angeles",
    "country": "USA",
    "postal_code": "90001"
  },
  "carrier": "FedEx",
  "estimated_delivery": "2024-12-31T23:59:59Z",
  "priority": "high"
}
```

#### List Shipments
```bash
GET /shipments?status=in_transit&page=1&limit=20
Authorization: Bearer <token>
```

### Events

#### Create Event
```bash
POST /shipments/:shipment_id/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "event_type": "in_transit",
  "location": {
    "city": "Chicago",
    "country": "USA",
    "latitude": 41.8781,
    "longitude": -87.6298
  },
  "description": "Package in transit"
}
```

### Analytics

#### Get Predictions
```bash
GET /analytics/predictions/:shipment_id
Authorization: Bearer <token>
```

#### Get Dashboard
```bash
GET /analytics/dashboard?from_date=2024-01-01&to_date=2024-12-31
Authorization: Bearer <token>
```

## Security Features

- **AES-256 Encryption**: All sensitive data encrypted at rest
- **TLS 1.3**: Secure data transmission
- **JWT Authentication**: Stateless authentication with 24-hour expiry
- **RBAC**: Role-based access control
- **Rate Limiting**: Tiered rate limits (100-1000 req/min)
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Helmet.js security headers
- **CSRF Protection**: CSRF token validation
- **Audit Logging**: Complete audit trail

## Compliance

- **GDPR**: Data privacy and consent management
- **PCI-DSS**: Payment card data security
- **ISO 27001**: Information security management
- **SOX**: Financial data compliance

## Performance

- **Response Time**: <200ms (95th percentile)
- **Throughput**: 10,000 requests/second
- **Caching**: Redis with configurable TTL
- **Database**: Connection pooling and read replicas
- **Horizontal Scaling**: Kubernetes-ready

## Monitoring

- **Health Check**: `GET /api/v1/health`
- **Metrics**: Prometheus metrics at `:9090/metrics`
- **Logging**: Winston with ELK stack integration
- **Tracing**: Distributed tracing ready

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For support, email support@logistics-monitor.com or open an issue on GitHub.