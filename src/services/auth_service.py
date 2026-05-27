"""Authentication Service

Handles user authentication, authorization, and session management.
"""

from src.repositories.user_repository import UserRepository
from src.configs.security import security_manager
from src.configs.logger import audit_logger
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AuthService:
    """Service for authentication and authorization"""
    
    def __init__(self):
        self.user_repo = UserRepository()
    
    def login(self, email, password, mfa_code=None):
        """Authenticate user and generate tokens
        
        Args:
            email: User email
            password: User password
            mfa_code: Optional MFA code
            
        Returns:
            Dictionary with tokens and user info, or None if auth fails
        """
        user = self.user_repo.get_by_email(email)
        
        if not user or not user.is_active:
            logger.warning(f"Login attempt for inactive/non-existent user: {email}")
            audit_logger.log_action('LOGIN_FAILED', details={'email': email, 'reason': 'user_not_found_or_inactive'})
            return None
        
        # Verify password
        if not security_manager.verify_password(password, user.password_hash):
            logger.warning(f"Invalid password for user: {email}")
            audit_logger.log_action('LOGIN_FAILED', user_id=str(user.id), details={'reason': 'invalid_password'})
            return None
        
        # Check MFA if enabled
        if user.mfa_enabled:
            if not mfa_code:
                logger.info(f"MFA code required for user: {email}")
                return {'requires_mfa': True}
            
            if not self._verify_mfa_code(user, mfa_code):
                logger.warning(f"Invalid MFA code for user: {email}")
                audit_logger.log_action('LOGIN_FAILED', user_id=str(user.id), details={'reason': 'invalid_mfa'})
                return None
        
        # Generate tokens
        access_token = security_manager.generate_token(str(user.id), user.role, 'access')
        refresh_token = security_manager.generate_token(str(user.id), user.role, 'refresh')
        
        # Update last login and store refresh token
        self.user_repo.update(
            user.id,
            last_login=datetime.utcnow(),
            refresh_token=refresh_token,
            refresh_token_expiry=datetime.utcnow() + timedelta(days=30)
        )
        
        logger.info(f"Successful login for user: {email}")
        audit_logger.log_action('LOGIN_SUCCESS', user_id=str(user.id), details={'email': email})
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': 900,  # 15 minutes
            'user': user.to_dict()
        }
    
    def refresh_token(self, refresh_token):
        """Refresh access token using refresh token
        
        Args:
            refresh_token: Refresh token
            
        Returns:
            New access token or None
        """
        payload = security_manager.verify_token(refresh_token)
        
        if not payload or payload.get('type') != 'refresh':
            logger.warning("Invalid refresh token")
            return None
        
        user = self.user_repo.get_by_id(payload['user_id'])
        
        if not user or not user.is_active or user.refresh_token != refresh_token:
            logger.warning(f"Refresh token mismatch or user inactive: {payload['user_id']}")
            return None
        
        # Check if refresh token has expired
        if user.refresh_token_expiry and user.refresh_token_expiry < datetime.utcnow():
            logger.warning(f"Refresh token expired for user: {payload['user_id']}")
            return None
        
        # Generate new access token
        new_access_token = security_manager.generate_token(str(user.id), user.role, 'access')
        
        logger.info(f"Token refreshed for user: {user.email}")
        audit_logger.log_action('TOKEN_REFRESHED', user_id=str(user.id))
        
        return {
            'access_token': new_access_token,
            'token_type': 'Bearer',
            'expires_in': 900
        }
    
    def logout(self, user_id):
        """Logout user and invalidate refresh token
        
        Args:
            user_id: User ID
            
        Returns:
            Boolean indicating success
        """
        user = self.user_repo.update(user_id, refresh_token=None, refresh_token_expiry=None)
        
        if user:
            logger.info(f"User logged out: {user.email}")
            audit_logger.log_action('LOGOUT', user_id=str(user_id))
            return True
        
        return False
    
    def _verify_mfa_code(self, user, code):
        """Verify MFA code
        
        Args:
            user: User instance
            code: MFA code
            
        Returns:
            Boolean indicating validity
        """
        if not user.mfa_code or not user.mfa_code_expiry:
            return False
        
        if datetime.utcnow() > user.mfa_code_expiry:
            return False
        
        return user.mfa_code == code
    
    def register_user(self, email, password, role='viewer', **kwargs):
        """Register a new user
        
        Args:
            email: User email
            password: User password
            role: User role
            **kwargs: Additional user attributes
            
        Returns:
            Created user instance or None
        """
        # Check if user already exists
        existing_user = self.user_repo.get_by_email(email)
        if existing_user:
            logger.warning(f"User registration failed - email already exists: {email}")
            return None
        
        # Hash password
        password_hash = security_manager.hash_password(password)
        
        # Create user
        user = self.user_repo.create(
            email=email,
            password_hash=password_hash,
            role=role,
            **kwargs
        )
        
        logger.info(f"New user registered: {email}")
        audit_logger.log_action('USER_REGISTERED', user_id=str(user.id), details={'email': email, 'role': role})
        
        return user