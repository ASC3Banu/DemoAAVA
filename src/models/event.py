"""Logistics Event Model

Defines the LogisticsEvent entity for event monitoring.
"""

from datetime import datetime
from src.configs.database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class LogisticsEvent(db.Model):
    """Logistics event model for shipment tracking"""
    
    __tablename__ = 'logistics_events'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('shipments.id'), nullable=False, index=True)
    
    # Event details
    event_type = db.Column(db.String(100), nullable=False)  # departure, arrival, delay, customs_clearance, delivery_attempt, exception
    event_description = db.Column(db.Text)
    event_timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Location information
    location = db.Column(db.String(255))
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    
    # Event severity and impact
    severity = db.Column(db.String(20), default='info')  # info, warning, error, critical
    impact_score = db.Column(db.Float)  # 0-100 scale
    
    # Source and attribution
    source_system = db.Column(db.String(100))  # API, sensor, manual, integration
    recorded_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Processing status
    processed = db.Column(db.Boolean, default=False)
    processed_at = db.Column(db.DateTime)
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Metadata
    metadata = db.Column(JSONB, default={})
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': str(self.id),
            'shipment_id': str(self.shipment_id),
            'event_type': self.event_type,
            'event_description': self.event_description,
            'event_timestamp': self.event_timestamp.isoformat() + 'Z' if self.event_timestamp else None,
            'location': self.location,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'severity': self.severity,
            'impact_score': self.impact_score,
            'source_system': self.source_system,
            'processed': self.processed,
            'processed_at': self.processed_at.isoformat() + 'Z' if self.processed_at else None,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'metadata': self.metadata
        }
    
    def __repr__(self):
        return f'<LogisticsEvent {self.event_type} for {self.shipment_id}>'