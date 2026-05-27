/**
 * Shipment Model
 * AI-Powered Logistics Monitoring System
 * 
 * Represents shipment entity with comprehensive validation and security
 * Implements data encryption for sensitive fields and audit logging
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const { encryptField, decryptField } = require('../utils/encryption');

const shipmentSchema = new mongoose.Schema({
  shipmentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    default: () => crypto.randomUUID()
  },
  trackingNumber: {
    type: String,
    required: [true, 'Tracking number is required'],
    unique: true,
    index: true,
    trim: true,
    uppercase: true,
    validate: {
      validator: function(v) {
        return /^[A-Z0-9]{10,20}$/.test(v);
      },
      message: 'Tracking number must be 10-20 alphanumeric characters'
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['created', 'in_transit', 'delivered', 'delayed', 'cancelled'],
    default: 'created',
    index: true
  },
  originLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 }
    },
    locationCode: String,
    facilityType: String
  },
  destinationLocation: {
    address: { type: String, required: true },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 }
    },
    locationCode: String,
    facilityType: String
  },
  currentLocation: {
    address: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    lastUpdated: { type: Date, default: Date.now }
  },
  transportMode: {
    type: String,
    required: true,
    enum: ['air', 'sea', 'road', 'rail'],
    index: true
  },
  carrier: {
    carrierId: { type: String, required: true, index: true },
    carrierName: { type: String, required: true },
    carrierCode: String,
    contactInfo: {
      phone: String,
      email: String
    }
  },
  timeline: {
    estimatedDeparture: Date,
    actualDeparture: Date,
    estimatedArrival: { type: Date, required: true },
    actualArrival: Date
  },
  cargoDetails: {
    weight: { type: Number, min: 0 },
    volume: { type: Number, min: 0 },
    value: { type: Number, min: 0 },
    description: String,
    hazardous: { type: Boolean, default: false },
    encryptedData: String // Encrypted sensitive cargo information
  },
  customerReference: {
    type: String,
    trim: true
  },
  // PII/PHI fields - encrypted at rest
  customerInfo: {
    customerId: String,
    encryptedName: String,
    encryptedContact: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Audit fields
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: String,
  deletedBy: String,
  deletedAt: Date,
  // Compliance fields
  dataLineage: [{
    source: String,
    timestamp: Date,
    action: String,
    userId: String
  }],
  consentManagement: {
    dataProcessingConsent: { type: Boolean, default: false },
    consentDate: Date,
    consentVersion: String
  },
  // Security fields
  encryptionVersion: { type: String, default: 'v1' },
  lastSecurityAudit: Date
}, {
  timestamps: true,
  collection: 'shipments'
});

// Indexes for performance optimization
shipmentSchema.index({ status: 1, createdAt: -1 });
shipmentSchema.index({ 'carrier.carrierId': 1, status: 1 });
shipmentSchema.index({ 'timeline.estimatedArrival': 1 });
shipmentSchema.index({ createdAt: -1 });
shipmentSchema.index({ updatedAt: -1 });

// Virtual for tracking URL
shipmentSchema.virtual('trackingUrl').get(function() {
  return `${process.env.BASE_URL}/track/${this.trackingNumber}`;
});

// Pre-save middleware for encryption
shipmentSchema.pre('save', async function(next) {
  try {
    // Encrypt sensitive cargo data
    if (this.isModified('cargoDetails') && this.cargoDetails.value) {
      const sensitiveData = JSON.stringify({
        value: this.cargoDetails.value,
        description: this.cargoDetails.description
      });
      this.cargoDetails.encryptedData = await encryptField(sensitiveData);
    }

    // Encrypt customer PII
    if (this.isModified('customerInfo')) {
      if (this.customerInfo.name) {
        this.customerInfo.encryptedName = await encryptField(this.customerInfo.name);
        delete this.customerInfo.name;
      }
      if (this.customerInfo.contact) {
        this.customerInfo.encryptedContact = await encryptField(this.customerInfo.contact);
        delete this.customerInfo.contact;
      }
    }

    // Update data lineage
    this.dataLineage.push({
      source: 'shipment_model',
      timestamp: new Date(),
      action: this.isNew ? 'create' : 'update',
      userId: this.updatedBy || this.createdBy
    });

    next();
  } catch (error) {
    next(error);
  }
});

// Method to decrypt sensitive data
shipmentSchema.methods.decryptSensitiveData = async function() {
  const decryptedData = {};

  if (this.cargoDetails.encryptedData) {
    const decrypted = await decryptField(this.cargoDetails.encryptedData);
    Object.assign(decryptedData, JSON.parse(decrypted));
  }

  if (this.customerInfo.encryptedName) {
    decryptedData.customerName = await decryptField(this.customerInfo.encryptedName);
  }

  if (this.customerInfo.encryptedContact) {
    decryptedData.customerContact = await decryptField(this.customerInfo.encryptedContact);
  }

  return decryptedData;
};

// Method to sanitize output (remove sensitive fields)
shipmentSchema.methods.toSafeObject = function(userRole) {
  const obj = this.toObject();
  
  // Remove encrypted fields from output
  if (obj.cargoDetails) {
    delete obj.cargoDetails.encryptedData;
  }
  
  if (obj.customerInfo) {
    delete obj.customerInfo.encryptedName;
    delete obj.customerInfo.encryptedContact;
  }

  // Role-based field filtering
  if (userRole !== 'admin' && userRole !== 'logistics_manager') {
    delete obj.cargoDetails.value;
    delete obj.customerInfo;
  }

  return obj;
};

// Static method for secure search
shipmentSchema.statics.secureFind = async function(query, userRole, userId) {
  // Apply role-based access control
  if (userRole === 'customer') {
    query['customerInfo.customerId'] = userId;
  }

  return this.find(query);
};

// Soft delete implementation
shipmentSchema.methods.softDelete = function(userId) {
  this.deletedAt = new Date();
  this.deletedBy = userId;
  this.dataLineage.push({
    source: 'shipment_model',
    timestamp: new Date(),
    action: 'soft_delete',
    userId: userId
  });
  return this.save();
};

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;