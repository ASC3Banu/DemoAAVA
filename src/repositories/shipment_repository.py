"""Shipment Repository

Handles database operations for Shipment entity.
"""

from src.repositories.base_repository import BaseRepository
from src.models.shipment import Shipment
from sqlalchemy import and_, or_
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ShipmentRepository(BaseRepository):
    """Repository for Shipment entity"""
    
    def __init__(self):
        super().__init__(Shipment)
    
    def get_by_tracking_number(self, tracking_number):
        """Get shipment by tracking number
        
        Args:
            tracking_number: Shipment tracking number
            
        Returns:
            Shipment instance or None
        """
        return Shipment.query.filter_by(tracking_number=tracking_number).first()
    
    def get_by_status(self, status, page=1, per_page=20):
        """Get shipments by status
        
        Args:
            status: Shipment status
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated shipment list
        """
        return Shipment.query.filter_by(status=status).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    def search_shipments(self, filters, page=1, per_page=20):
        """Search shipments with multiple filters
        
        Args:
            filters: Dictionary of filter conditions
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated shipment list
        """
        query = Shipment.query
        
        if filters.get('status'):
            query = query.filter(Shipment.status == filters['status'])
        
        if filters.get('origin'):
            query = query.filter(Shipment.origin.ilike(f"%{filters['origin']}%"))
        
        if filters.get('destination'):
            query = query.filter(Shipment.destination.ilike(f"%{filters['destination']}%"))
        
        if filters.get('from_date'):
            query = query.filter(Shipment.created_at >= filters['from_date'])
        
        if filters.get('to_date'):
            query = query.filter(Shipment.created_at <= filters['to_date'])
        
        if filters.get('carrier_name'):
            query = query.filter(Shipment.carrier_name.ilike(f"%{filters['carrier_name']}%"))
        
        return query.paginate(page=page, per_page=per_page, error_out=False)
    
    def get_delayed_shipments(self, page=1, per_page=20):
        """Get delayed shipments
        
        Args:
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated delayed shipment list
        """
        return Shipment.query.filter_by(status='delayed').paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    def get_in_transit_shipments(self, page=1, per_page=20):
        """Get in-transit shipments
        
        Args:
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated in-transit shipment list
        """
        return Shipment.query.filter_by(status='in_transit').paginate(
            page=page, per_page=per_page, error_out=False
        )