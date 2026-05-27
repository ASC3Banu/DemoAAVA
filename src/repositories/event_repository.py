"""Event Repository

Handles database operations for LogisticsEvent entity.
"""

from src.repositories.base_repository import BaseRepository
from src.models.event import LogisticsEvent
from sqlalchemy import and_
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EventRepository(BaseRepository):
    """Repository for LogisticsEvent entity"""
    
    def __init__(self):
        super().__init__(LogisticsEvent)
    
    def get_by_shipment(self, shipment_id, page=1, per_page=20):
        """Get events for a specific shipment
        
        Args:
            shipment_id: Shipment ID
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated event list
        """
        return LogisticsEvent.query.filter_by(shipment_id=shipment_id).order_by(
            LogisticsEvent.event_timestamp.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
    
    def get_by_type(self, event_type, page=1, per_page=20):
        """Get events by type
        
        Args:
            event_type: Event type
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated event list
        """
        return LogisticsEvent.query.filter_by(event_type=event_type).order_by(
            LogisticsEvent.event_timestamp.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
    
    def search_events(self, filters, page=1, per_page=20):
        """Search events with multiple filters
        
        Args:
            filters: Dictionary of filter conditions
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated event list
        """
        query = LogisticsEvent.query
        
        if filters.get('shipment_id'):
            query = query.filter(LogisticsEvent.shipment_id == filters['shipment_id'])
        
        if filters.get('event_type'):
            query = query.filter(LogisticsEvent.event_type == filters['event_type'])
        
        if filters.get('severity'):
            query = query.filter(LogisticsEvent.severity == filters['severity'])
        
        if filters.get('from_date'):
            query = query.filter(LogisticsEvent.event_timestamp >= filters['from_date'])
        
        if filters.get('to_date'):
            query = query.filter(LogisticsEvent.event_timestamp <= filters['to_date'])
        
        if filters.get('processed') is not None:
            query = query.filter(LogisticsEvent.processed == filters['processed'])
        
        return query.order_by(LogisticsEvent.event_timestamp.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    def get_unprocessed_events(self, page=1, per_page=20):
        """Get unprocessed events
        
        Args:
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated unprocessed event list
        """
        return LogisticsEvent.query.filter_by(processed=False).order_by(
            LogisticsEvent.event_timestamp.asc()
        ).paginate(page=page, per_page=per_page, error_out=False)
    
    def mark_as_processed(self, event_id):
        """Mark event as processed
        
        Args:
            event_id: Event ID
            
        Returns:
            Updated event instance
        """
        return self.update(event_id, processed=True, processed_at=datetime.utcnow())