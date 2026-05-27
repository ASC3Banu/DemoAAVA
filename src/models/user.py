"""User Model

Defines the User entity with authentication and RBAC support.
"""

from datetime import datetime
from src.configs.database import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

class User(db.Model):
    """User model for authentication and authorization"""
    
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='viewer')  # admin, operator, viewer
    
    # MFA fields
    mfa_enabled = db.Column(db.Boolean, default=False)
    mfa_secret = db.Column(db.String(255), nullable=True)
    mfa_code = db.Column(db.String(10), nullable=True)
    mfa_code_expiry = db.Column(db.DateTime, nullable=True)
    
    # Profile information
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    
    # Account status
    is_active = db.Column(db.Boolean, default=True)
    is_verified = db.Column(db.Boolean, default=False)
    
    # Audit fields
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Refresh token for session management
    refresh_token = db.Column(db.String(500))
    refresh_token_expiry = db.Column(db.DateTime)
    
    # Metadata
    metadata = db.Column(JSONB, default={})
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': str(self.id),
            'email': self.email,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'mfa_enabled': self.mfa_enabled,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() + 'Z' if self.created_at else None,
            'last_login': self.last_login.isoformat() + 'Z' if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.email}>'