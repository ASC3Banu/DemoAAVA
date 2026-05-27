"""Alert Model

Defines the Alert entity for alert and escalation management.
"""

from datetime import datetime
from src.configs.database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class Alert(db.Model):
    """Alert model for notifications and escalations"""
    
    __tablename__ = 'alerts'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shipment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('shipments.id'), nullable=False, index=True)
    
    # Alert details
    alert_type = db.Column(db.String(100), nullable=False)  # delay, exception, customs, delivery_failure
    severity = db.Column(db.String(20), nullable=False)  # low, medium, high, critical
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    
    # Status tracking
    status = db.Column(db.String(50), nullable=False, default='open')  # open, acknowledged, resolved, closed
    
    # Assignment and escalation
    assigned_to = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    escalation_level = db.Column(db.Integer, default=0)
    escalated_at = db.Column(db.DateTime)
    
    # Resolution tracking
    acknowledged_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    acknowledged_at = db.Column(db.DateTime)
    acknowledgment_notes = db.Column(db.Text)
    
    resolved_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    resolution_description = db.Column(db.Text)
    
    # Notification tracking
    notification_sent = db.Column(db.Boolean, default=False)
    notification_channels = db.Column(JSONB, default=[])  # email, sms, webhook
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata
    metadata = db.Column(JSONB, default={})
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': str(self.id),
            'shipment_id': str(self.shipment_id),
            'alert_type': self.alert_type,
            'severity': self.severity,
            'title': self.title,
            'description': self.description,
            'status': self.status,
            'assigned_to': str(self.assigned_to) if self.assigned_to else None,
            'escalation_level': self.escalation_level,
            'escalated_at': self.escalated_at.isoformat() + 'Z' if self.escalated_at else None,
            'acknowledged_by': str(self.acknowledged_by) if self.acknowledged_by else None,
            'acknowledged_at': self.acknowledged_at.isoformat() + 'Z' if self.acknowledged_at else None,
            'acknowledgment_notes': self.acknowledgment_notes,
            'resolved_by': str(self.resolved_by) if self.resolved_by else None,
            'resolved_at': self.resolved_at.isoformat() + 'Z' if self.resolved_at else None,
            'resolution_description': self.resolution_description,
            'notification_sent': self.notification_sent,
            'notification_channels': self.notification_channels,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'metadata': self.metadata
        }
    
    def __repr__(self):
        return f'<Alert {self.alert_type} - {self.severity}>'