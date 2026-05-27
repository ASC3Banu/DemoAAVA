"""Webhook Model

Defines the Webhook entity for external integrations.
"""

from datetime import datetime
from src.configs.database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
import uuid

class Webhook(db.Model):
    """Webhook model for external integrations"""
    
    __tablename__ = 'webhooks'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Webhook configuration
    url = db.Column(db.String(500), nullable=False)
    method = db.Column(db.String(10), default='POST')  # POST, PUT
    
    # Event subscriptions
    event_types = db.Column(ARRAY(db.String), nullable=False)  # shipment_created, shipment_updated, alert_created, etc.
    
    # Authentication
    auth_type = db.Column(db.String(50))  # bearer, basic, api_key
    auth_credentials = db.Column(db.String(500))  # Encrypted
    
    # Headers and payload configuration
    custom_headers = db.Column(JSONB, default={})
    payload_template = db.Column(JSONB, default={})
    
    # Status and health
    is_active = db.Column(db.Boolean, default=True)
    last_triggered_at = db.Column(db.DateTime)
    last_success_at = db.Column(db.DateTime)
    last_failure_at = db.Column(db.DateTime)
    failure_count = db.Column(db.Integer, default=0)
    
    # Retry configuration
    retry_enabled = db.Column(db.Boolean, default=True)
    max_retries = db.Column(db.Integer, default=3)
    retry_delay_seconds = db.Column(db.Integer, default=5)
    
    # Owner information
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata
    metadata = db.Column(JSONB, default={})
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': str(self.id),
            'url': self.url,
            'method': self.method,
            'event_types': self.event_types,
            'auth_type': self.auth_type,
            'custom_headers': self.custom_headers,
            'is_active': self.is_active,
            'last_triggered_at': self.last_triggered_at.isoformat() + 'Z' if self.last_triggered_at else None,
            'last_success_at': self.last_success_at.isoformat() + 'Z' if self.last_success_at else None,
            'last_failure_at': self.last_failure_at.isoformat() + 'Z' if self.last_failure_at else None,
            'failure_count': self.failure_count,
            'retry_enabled': self.retry_enabled,
            'max_retries': self.max_retries,
            'retry_delay_seconds': self.retry_delay_seconds,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'metadata': self.metadata
        }
    
    def __repr__(self):
        return f'<Webhook {self.url}>'