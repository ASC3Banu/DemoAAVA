-- Seed Data for AI-Powered Logistics Monitoring System
-- Version: 1.0

-- Insert Sample Carriers
INSERT INTO carriers (carrier_id, carrier_name, carrier_type, contact_info, is_active) VALUES
('carrier-001', 'Global Shipping Co', 'ocean', 'contact@globalshipping.com', true),
('carrier-002', 'Air Express Logistics', 'air', 'support@airexpress.com', true),
('carrier-003', 'Ground Transport Inc', 'ground', 'info@groundtransport.com', true),
('carrier-004', 'Rail Freight Services', 'rail', 'service@railfreight.com', true);

-- Insert Sample Users
INSERT INTO users (username, email, password_hash, role, is_active, mfa_enabled) VALUES
('admin', 'admin@logistics-monitor.com', '$2b$10$example_hash', 'system_admin', true, true),
('logistics_mgr', 'manager@logistics-monitor.com', '$2b$10$example_hash', 'logistics_manager', true, false),
('analyst', 'analyst@logistics-monitor.com', '$2b$10$example_hash', 'supply_chain_analyst', true, false),
('business_owner', 'owner@logistics-monitor.com', '$2b$10$example_hash', 'business_owner', true, false);

-- Note: In production, password_hash should be generated using bcrypt with actual passwords