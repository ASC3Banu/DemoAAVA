"""User Repository

Handles database operations for User entity.
"""

from src.repositories.base_repository import BaseRepository
from src.models.user import User
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class UserRepository(BaseRepository):
    """Repository for User entity"""
    
    def __init__(self):
        super().__init__(User)
    
    def get_by_email(self, email):
        """Get user by email
        
        Args:
            email: User email
            
        Returns:
            User instance or None
        """
        return User.query.filter_by(email=email).first()
    
    def get_by_role(self, role, page=1, per_page=20):
        """Get users by role
        
        Args:
            role: User role
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated user list
        """
        return User.query.filter_by(role=role).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    def update_last_login(self, user_id):
        """Update user's last login timestamp
        
        Args:
            user_id: User ID
            
        Returns:
            Updated user instance
        """
        return self.update(user_id, last_login=datetime.utcnow())
    
    def activate_user(self, user_id):
        """Activate user account
        
        Args:
            user_id: User ID
            
        Returns:
            Updated user instance
        """
        return self.update(user_id, is_active=True)
    
    def deactivate_user(self, user_id):
        """Deactivate user account
        
        Args:
            user_id: User ID
            
        Returns:
            Updated user instance
        """
        return self.update(user_id, is_active=False)