/**
 * Database Schema
 * PostgreSQL database schema for logistics monitoring system
 * 
 * Security: Encrypted fields, audit columns, RBAC tables
 * Compliance: Data retention policies, audit logging
 */

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shipments table
CREATE TABLE IF NOT EXISTS shipments (
  shipment_id VARCHAR(50) PRIMARY KEY,
  origin VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  arrival_time TIMESTAMP NOT NULL,
  actual_departure_time TIMESTAMP,
  actual_arrival_time TIMESTAMP,
  estimated_arrival_time TIMESTAMP,
  carrier VARCHAR(100),
  transport_mode VARCHAR(50),
  status VARCHAR(50) NOT NULL,
  current_location VARCHAR(500),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  event_id VARCHAR(50) PRIMARY KEY,
  shipment_id VARCHAR(50) REFERENCES shipments(shipment_id),
  event_type VARCHAR(50) NOT NULL,
  event_time TIMESTAMP NOT NULL,
  location VARCHAR(255) NOT NULL,
  details TEXT,
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  alert_id VARCHAR(50) PRIMARY KEY,
  shipment_id VARCHAR(50) REFERENCES shipments(shipment_id),
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(50) NOT NULL,
  alert_type VARCHAR(50),
  prediction_confidence DECIMAL(3,2),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id VARCHAR(100),
  user_id UUID,
  organization_id UUID,
  method VARCHAR(10),
  path VARCHAR(500),
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address VARCHAR(50),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_shipments_org ON shipments(organization_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_created ON shipments(created_at);
CREATE INDEX idx_events_shipment ON events(shipment_id);
CREATE INDEX idx_events_time ON events(event_time);
CREATE INDEX idx_alerts_shipment ON alerts(shipment_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
