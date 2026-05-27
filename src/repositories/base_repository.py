"""Base Repository

Provides common CRUD operations for all repositories.
"""

from src.configs.database import db
from sqlalchemy import and_, or_
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BaseRepository:
    """Base repository with common database operations"""
    
    def __init__(self, model):
        self.model = model
    
    def create(self, **kwargs):
        """Create a new record
        
        Args:
            **kwargs: Model attributes
            
        Returns:
            Created model instance
        """
        try:
            instance = self.model(**kwargs)
            db.session.add(instance)
            db.session.commit()
            logger.info(f"Created {self.model.__name__} with id {instance.id}")
            return instance
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating {self.model.__name__}: {str(e)}")
            raise
    
    def get_by_id(self, id):
        """Get record by ID
        
        Args:
            id: Record ID
            
        Returns:
            Model instance or None
        """
        return self.model.query.get(id)
    
    def get_all(self, filters=None, page=1, per_page=20, order_by=None):
        """Get all records with optional filtering and pagination
        
        Args:
            filters: Dictionary of filter conditions
            page: Page number
            per_page: Records per page
            order_by: Order by clause
            
        Returns:
            Paginated query result
        """
        query = self.model.query
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        
        if order_by:
            query = query.order_by(order_by)
        
        return query.paginate(page=page, per_page=per_page, error_out=False)
    
    def update(self, id, **kwargs):
        """Update a record
        
        Args:
            id: Record ID
            **kwargs: Attributes to update
            
        Returns:
            Updated model instance or None
        """
        try:
            instance = self.get_by_id(id)
            if not instance:
                return None
            
            for key, value in kwargs.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            
            instance.updated_at = datetime.utcnow()
            db.session.commit()
            logger.info(f"Updated {self.model.__name__} with id {id}")
            return instance
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating {self.model.__name__}: {str(e)}")
            raise
    
    def delete(self, id):
        """Delete a record
        
        Args:
            id: Record ID
            
        Returns:
            Boolean indicating success
        """
        try:
            instance = self.get_by_id(id)
            if not instance:
                return False
            
            db.session.delete(instance)
            db.session.commit()
            logger.info(f"Deleted {self.model.__name__} with id {id}")
            return True
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error deleting {self.model.__name__}: {str(e)}")
            raise
    
    def count(self, filters=None):
        """Count records
        
        Args:
            filters: Dictionary of filter conditions
            
        Returns:
            Record count
        """
        query = self.model.query
        
        if filters:
            for key, value in filters.items():
                if hasattr(self.model, key):
                    query = query.filter(getattr(self.model, key) == value)
        
        return query.count()