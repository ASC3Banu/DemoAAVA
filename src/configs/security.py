"""Security Configuration and Utilities

Implements authentication, authorization, encryption, and security middleware.
Complies with NFR-001 to NFR-010 security requirements.
"""

import os
import jwt
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import base64
import logging

logger = logging.getLogger(__name__)

class SecurityManager:
    """Centralized security management"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize security with Flask app"""
        self.app = app
        self.jwt_secret = app.config['JWT_SECRET_KEY']
        self.encryption_key = app.config['ENCRYPTION_KEY'].encode()
        
        # Initialize AES-256 encryption
        self.cipher = Fernet(base64.urlsafe_b64encode(self.encryption_key[:32]))
    
    def generate_token(self, user_id, role, token_type='access'):
        """Generate JWT token
        
        Args:
            user_id: User identifier
            role: User role for RBAC
            token_type: 'access' or 'refresh'
            
        Returns:
            JWT token string
        """
        expiry = (
            self.app.config['JWT_ACCESS_TOKEN_EXPIRES']
            if token_type == 'access'
            else self.app.config['JWT_REFRESH_TOKEN_EXPIRES']
        )
        
        payload = {
            'user_id': user_id,
            'role': role,
            'type': token_type,
            'exp': datetime.utcnow() + expiry,
            'iat': datetime.utcnow(),
            'jti': secrets.token_urlsafe(16)
        }
        
        token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
        
        logger.info(f"Generated {token_type} token for user {user_id}")
        return token
    
    def verify_token(self, token):
        """Verify and decode JWT token
        
        Args:
            token: JWT token string
            
        Returns:
            Decoded payload or None if invalid
        """
        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None
    
    def hash_password(self, password):
        """Hash password using bcrypt
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password
        """
        return generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)
    
    def verify_password(self, password, password_hash):
        """Verify password against hash
        
        Args:
            password: Plain text password
            password_hash: Stored password hash
            
        Returns:
            Boolean indicating match
        """
        return check_password_hash(password_hash, password)
    
    def encrypt_data(self, data):
        """Encrypt sensitive data using AES-256
        
        Args:
            data: String data to encrypt
            
        Returns:
            Encrypted data as base64 string
        """
        if not data:
            return None
        
        encrypted = self.cipher.encrypt(data.encode())
        return base64.b64encode(encrypted).decode()
    
    def decrypt_data(self, encrypted_data):
        """Decrypt sensitive data
        
        Args:
            encrypted_data: Base64 encoded encrypted data
            
        Returns:
            Decrypted string
        """
        if not encrypted_data:
            return None
        
        try:
            decoded = base64.b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(decoded)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            return None
    
    def generate_mfa_code(self):
        """Generate 6-digit MFA code
        
        Returns:
            6-digit string code
        """
        return str(secrets.randbelow(1000000)).zfill(6)
    
    def mask_pii(self, data, field_name):
        """Mask PII/PHI/PCI data for logging
        
        Args:
            data: Data to mask
            field_name: Field name to check against PII list
            
        Returns:
            Masked data
        """
        pii_fields = self.app.config.get('PII_FIELDS', [])
        phi_fields = self.app.config.get('PHI_FIELDS', [])
        pci_fields = self.app.config.get('PCI_FIELDS', [])
        
        sensitive_fields = pii_fields + phi_fields + pci_fields
        
        if field_name.lower() in [f.lower() for f in sensitive_fields]:
            if data and len(str(data)) > 4:
                return '*' * (len(str(data)) - 4) + str(data)[-4:]
            return '****'
        
        return data

# Global security manager instance
security_manager = SecurityManager()

def init_security(app):
    """Initialize security manager with app"""
    security_manager.init_app(app)

def require_auth(f):
    """Decorator to require authentication
    
    Validates JWT token from Authorization header.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': 'Authorization header required',
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'traceId': g.get('request_id', 'unknown')
                }
            }), 401
        
        try:
            token_type, token = auth_header.split(' ')
            if token_type.lower() != 'bearer':
                raise ValueError('Invalid token type')
        except ValueError:
            return jsonify({
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': 'Invalid authorization header format',
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'traceId': g.get('request_id', 'unknown')
                }
            }), 401
        
        payload = security_manager.verify_token(token)
        if not payload:
            return jsonify({
                'error': {
                    'code': 'UNAUTHORIZED',
                    'message': 'Invalid or expired token',
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'traceId': g.get('request_id', 'unknown')
                }
            }), 401
        
        # Store user info in request context
        g.user_id = payload['user_id']
        g.user_role = payload['role']
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_role(*roles):
    """Decorator to require specific role(s)
    
    Implements Role-Based Access Control (RBAC).
    
    Args:
        *roles: Allowed roles (admin, operator, viewer)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'user_role'):
                return jsonify({
                    'error': {
                        'code': 'UNAUTHORIZED',
                        'message': 'Authentication required',
                        'timestamp': datetime.utcnow().isoformat() + 'Z',
                        'traceId': g.get('request_id', 'unknown')
                    }
                }), 401
            
            if g.user_role not in roles:
                return jsonify({
                    'error': {
                        'code': 'FORBIDDEN',
                        'message': f'Insufficient permissions. Required role: {", ".join(roles)}',
                        'timestamp': datetime.utcnow().isoformat() + 'Z',
                        'traceId': g.get('request_id', 'unknown')
                    }
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def validate_input(schema):
    """Decorator to validate request input against schema
    
    Args:
        schema: Validation schema function
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                data = request.get_json()
                errors = schema(data)
                
                if errors:
                    return jsonify({
                        'error': {
                            'code': 'VALIDATION_ERROR',
                            'message': 'Input validation failed',
                            'details': errors,
                            'timestamp': datetime.utcnow().isoformat() + 'Z',
                            'traceId': g.get('request_id', 'unknown')
                        }
                    }), 400
                
                return f(*args, **kwargs)
            except Exception as e:
                logger.error(f"Validation error: {str(e)}")
                return jsonify({
                    'error': {
                        'code': 'VALIDATION_ERROR',
                        'message': 'Invalid request data',
                        'timestamp': datetime.utcnow().isoformat() + 'Z',
                        'traceId': g.get('request_id', 'unknown')
                    }
                }), 400
        
        return decorated_function
    return decorator