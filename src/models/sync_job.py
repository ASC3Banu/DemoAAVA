"""Sync Job Model

Defines the SyncJob entity for external system synchronization.
"""

from datetime import datetime
from src.configs.database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class SyncJob(db.Model):
    """Sync job model for external system integration"""
    
    __tablename__ = 'sync_jobs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Job configuration
    external_system = db.Column(db.String(100), nullable=False)  # SAP, Oracle, customs_portal
    sync_type = db.Column(db.String(50), nullable=False)  # full, incremental
    direction = db.Column(db.String(20), nullable=False)  # import, export, bidirectional
    
    # Job status
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, running, completed, failed
    progress_percentage = db.Column(db.Float, default=0.0)
    
    # Execution details
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    duration_seconds = db.Column(db.Float)
    
    # Results
    records_processed = db.Column(db.Integer, default=0)
    records_succeeded = db.Column(db.Integer, default=0)
    records_failed = db.Column(db.Integer, default=0)
    
    # Error tracking
    error_message = db.Column(db.Text)
    error_details = db.Column(JSONB, default={})
    
    # Initiated by
    initiated_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Metadata
    metadata = db.Column(JSONB, default={})
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': str(self.id),
            'external_system': self.external_system,
            'sync_type': self.sync_type,
            'direction': self.direction,
            'status': self.status,
            'progress_percentage': self.progress_percentage,
            'started_at': self.started_at.isoformat() + 'Z' if self.started_at else None,
            'completed_at': self.completed_at.isoformat() + 'Z' if self.completed_at else None,
            'duration_seconds': self.duration_seconds,
            'records_processed': self.records_processed,
            'records_succeeded': self.records_succeeded,
            'records_failed': self.records_failed,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'updated_at': self.updated_at.isoformat() + 'Z' if self.updated_at else None,
            'metadata': self.metadata
        }
    
    def __repr__(self):
        return f'<SyncJob {self.external_system} - {self.status}>'