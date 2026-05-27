/**
 * Event Model
 * AI-Powered Logistics Monitoring System
 * 
 * Represents logistics tracking events with audit trail and encryption
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const eventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => crypto.randomUUID()
  },
  shipmentId: {
    type: String,
    required: true,
    index: true,
    ref: 'Shipment'
  },
  eventType: {
    type: String,
    required: true,
    enum: ['pickup', 'departure', 'arrival', 'delivery', 'delay', 'exception', 'customs_clearance', 'in_transit'],
    index: true
  },
  location: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 }
    },
    locationCode: String,
    facilityType: String
  },
  timestamp: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['completed', 'in_progress', 'failed', 'pending']
  },
  description: {
    type: String,
    maxlength: 1000
  },
  sourceSystem: {
    type: String,
    required: true,
    enum: ['carrier_api', 'port_system', 'warehouse_system', 'customs_system', 'manual_entry', 'iot_sensor']
  },
  eventData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Security and audit fields
  createdBy: {
    type: String,
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['verified', 'unverified', 'disputed'],
    default: 'unverified'
  },
  verifiedBy: String,
  verifiedAt: Date,
  // Data lineage for compliance
  dataLineage: {
    sourceIp: String,
    sourceUser: String,
    sourceTimestamp: Date,
    processingTimestamp: Date,
    transformations: [String]
  },
  // Encryption metadata
  encryptionVersion: { type: String, default: 'v1' },
  checksumHash: String
}, {
  timestamps: true,
  collection: 'events'
});

// Compound indexes for query optimization
eventSchema.index({ shipmentId: 1, timestamp: -1 });
eventSchema.index({ eventType: 1, timestamp: -1 });
eventSchema.index({ sourceSystem: 1, createdAt: -1 });

// Pre-save middleware for checksum generation
eventSchema.pre('save', function(next) {
  // Generate checksum for data integrity
  const dataString = JSON.stringify({
    shipmentId: this.shipmentId,
    eventType: this.eventType,
    timestamp: this.timestamp,
    location: this.location
  });
  
  this.checksumHash = crypto.createHash('sha256').update(dataString).digest('hex');
  next();
});

// Method to verify event integrity
eventSchema.methods.verifyIntegrity = function() {
  const dataString = JSON.stringify({
    shipmentId: this.shipmentId,
    eventType: this.eventType,
    timestamp: this.timestamp,
    location: this.location
  });
  
  const currentHash = crypto.createHash('sha256').update(dataString).digest('hex');
  return currentHash === this.checksumHash;
};

// Static method for event aggregation
eventSchema.statics.getEventTimeline = async function(shipmentId) {
  return this.find({ shipmentId })
    .sort({ timestamp: 1 })
    .select('-eventData -dataLineage')
    .lean();
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;