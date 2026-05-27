const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  shipment_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'shipments',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  event_type: {
    type: DataTypes.ENUM('pickup', 'departure', 'arrival', 'delivery', 'delay', 'exception'),
    allowNull: false
  },
  location: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'system'
  },
  severity: {
    type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
    defaultValue: 'info'
  },
  processed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'events',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { fields: ['shipment_id'] },
    { fields: ['event_type'] },
    { fields: ['timestamp'] },
    { fields: ['processed'] },
    { fields: ['severity'] }
  ]
});

module.exports = Event;