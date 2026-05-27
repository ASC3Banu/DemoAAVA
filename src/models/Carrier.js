const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Carrier = sequelize.define('Carrier', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  transport_modes: {
    type: DataTypes.ARRAY(DataTypes.ENUM('air', 'sea', 'road', 'rail')),
    allowNull: false
  },
  contact_info: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  api_config: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    }
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  tableName: 'carriers',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { fields: ['code'], unique: true },
    { fields: ['is_active'] }
  ]
});

module.exports = Carrier;