const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
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
  alert_type: {
    type: DataTypes.ENUM('delay', 'exception', 'delivery', 'customs'),
    allowNull: false
  },
  severity: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    defaultValue: 'medium'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'acknowledged', 'resolved', 'closed'),
    defaultValue: 'open'
  },
  triggered_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  acknowledged_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  acknowledged_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  resolved_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  notification_sent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  notification_channels: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'alerts',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { fields: ['shipment_id'] },
    { fields: ['alert_type'] },
    { fields: ['severity'] },
    { fields: ['status'] },
    { fields: ['triggered_at'] }
  ]
});

module.exports = Alert;