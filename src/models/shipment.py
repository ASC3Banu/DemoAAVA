"""Shipment Model

Defines the Shipment entity for tracking logistics shipments.
"""

from datetime import datetime
from src.configs.database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class Shipment(db.Model):
    """Shipment model for logistics tracking"""
    
    __tablename__ = 'shipments'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tracking_number = db.Column(db.String(100), unique=True, nullable=False, index=True)
    
    # Shipment details
    origin = db.Column(db.String(255), nullable=False)
    destination = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, in_transit, delivered, delayed, cancelled
    
    # Cargo information
    cargo_description = db.Column(db.Text)
    cargo_weight = db.Column(db.Float)  # in kg
    cargo_value = db.Column(db.Float)  # in USD
    cargo_type = db.Column(db.String(100))
    
    # Carrier information
    carrier_name = db.Column(db.String(255))
    carrier_service = db.Column(db.String(100))
    
    # Timeline
    estimated_departure = db.Column(db.DateTime)
    actual_departure = db.Column(db.DateTime)
    estimated_arrival = db.Column(db.DateTime)
    actual_arrival = db.Column(db.DateTime)
    
    # Current location
    current_location = db.Column(db.String(255))
    current_latitude = db.Column(db.Float)
    current_longitude = db.Column(db.Float)
    
    # Customer information (encrypted)
    customer_name = db.Column(db.String(255))
    customer_email = db.Column(db.String(255))
    customer_phone = db.Column(db.String(50))
    
    # Priority and special handling
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    special_instructions = db.Column(db.Text)
    requires_signature = db.Column(db.Boolean, default=False)
    
    # Audit fields
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata and custom fields
    metadata = db.Column(JSONB, default={})
    
    # Relationships
    events = db.relationship('LogisticsEvent', backref='shipment', lazy='dynamic', cascade='all, delete-orphan')
    predictions = db.relationship('DelayPrediction', backref='shipment', lazy='dynamic', cascade='all, delete-orphan')
    alerts = db.relationship('Alert', backref='shipment', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': str(self.id),
            'tracking_number': self.tracking_number,
            'origin': self.origin,
            'destination': self.destination,
            'status': self.status,
            'cargo_description': self.cargo_description,
            'cargo_weight': self.cargo_weight,
            'cargo_value': self.cargo_value,
            'cargo_type': self.cargo_type,
            'carrier_name': self.carrier_name,
            'carrier_service': self.carrier_service,
            'estimated_departure': self.estimated_departure.isoformat() + 'Z' if self.estimated_departure else None,
            'actual_departure': self.actual_departure.isoformat() + 'Z' if self.actual_departure else None,
            'estimated_arrival': self.estimated_arrival.isoformat() + 'Z' if self.estimated_arrival else None,
            'actual_arrival': self.actual_arrival.isoformat() + 'Z' if self.actual_arrival else None,
            'current_location': self.current_location,
            'current_latitude': self.current_latitude,
            'current_longitude': self.current_longitude,
            'customer_name': self.customer_name,
            'customer_email': self.customer_email,
            'customer_phone': self.customer_phone,
            'priority': self.priority,
            'special_instructions': self.special_instructions,
            'requires_signature': self.requires_signature,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'metadata': self.metadata
        }
    
    def __repr__(self):
        return f'<Shipment {self.tracking_number}>'