const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tracking_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [8, 50]
    }
  },
  status: {
    type: DataTypes.ENUM('created', 'in_transit', 'delivered', 'delayed', 'cancelled'),
    allowNull: false,
    defaultValue: 'created'
  },
  transport_mode: {
    type: DataTypes.ENUM('air', 'sea', 'road', 'rail'),
    allowNull: false
  },
  carrier_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'carriers',
      key: 'id'
    }
  },
  origin: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidLocation(value) {
        if (!value.address || !value.city || !value.country || !value.postal_code) {
          throw new Error('Origin must have address, city, country, and postal_code');
        }
      }
    }
  },
  destination: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidLocation(value) {
        if (!value.address || !value.city || !value.country || !value.postal_code) {
          throw new Error('Destination must have address, city, country, and postal_code');
        }
      }
    }
  },
  current_location: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  estimated_delivery: {
    type: DataTypes.DATE,
    allowNull: false
  },
  actual_delivery: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cargo_details: {
    type: DataTypes.JSONB,
    allowNull: false,
    validate: {
      isValidCargo(value) {
        if (!value.weight || !value.description) {
          throw new Error('Cargo must have weight and description');
        }
      }
    }
  },
  contact_info: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false
  },
  updated_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'shipments',
  timestamps: true,
  paranoid: true,
  underscored: true,
  indexes: [
    { fields: ['tracking_number'], unique: true },
    { fields: ['status'] },
    { fields: ['carrier_id'] },
    { fields: ['created_at'] },
    { fields: ['estimated_delivery'] },
    { fields: ['created_by'] }
  ]
});

module.exports = Shipment;