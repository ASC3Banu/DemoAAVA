"""Alert Repository

Handles database operations for Alert entity.
"""

from src.repositories.base_repository import BaseRepository
from src.models.alert import Alert
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AlertRepository(BaseRepository):
    """Repository for Alert entity"""
    
    def __init__(self):
        super().__init__(Alert)
    
    def get_by_shipment(self, shipment_id, page=1, per_page=20):
        """Get alerts for a specific shipment
        
        Args:
            shipment_id: Shipment ID
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated alert list
        """
        return Alert.query.filter_by(shipment_id=shipment_id).order_by(
            Alert.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
    
    def get_by_status(self, status, page=1, per_page=20):
        """Get alerts by status
        
        Args:
            status: Alert status
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated alert list
        """
        return Alert.query.filter_by(status=status).order_by(
            Alert.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
    
    def get_by_severity(self, severity, page=1, per_page=20):
        """Get alerts by severity
        
        Args:
            severity: Alert severity
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated alert list
        """
        return Alert.query.filter_by(severity=severity).order_by(
            Alert.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
    
    def search_alerts(self, filters, page=1, per_page=20):
        """Search alerts with multiple filters
        
        Args:
            filters: Dictionary of filter conditions
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated alert list
        """
        query = Alert.query
        
        if filters.get('shipment_id'):
            query = query.filter(Alert.shipment_id == filters['shipment_id'])
        
        if filters.get('status'):
            query = query.filter(Alert.status == filters['status'])
        
        if filters.get('severity'):
            query = query.filter(Alert.severity == filters['severity'])
        
        if filters.get('alert_type'):
            query = query.filter(Alert.alert_type == filters['alert_type'])
        
        if filters.get('assigned_to'):
            query = query.filter(Alert.assigned_to == filters['assigned_to'])
        
        return query.order_by(Alert.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    def acknowledge_alert(self, alert_id, user_id, notes=None):
        """Acknowledge an alert
        
        Args:
            alert_id: Alert ID
            user_id: User ID who acknowledged
            notes: Optional acknowledgment notes
            
        Returns:
            Updated alert instance
        """
        return self.update(
            alert_id,
            status='acknowledged',
            acknowledged_by=user_id,
            acknowledged_at=datetime.utcnow(),
            acknowledgment_notes=notes
        )
    
    def resolve_alert(self, alert_id, user_id, resolution_description):
        """Resolve an alert
        
        Args:
            alert_id: Alert ID
            user_id: User ID who resolved
            resolution_description: Resolution description
            
        Returns:
            Updated alert instance
        """
        return self.update(
            alert_id,
            status='resolved',
            resolved_by=user_id,
            resolved_at=datetime.utcnow(),
            resolution_description=resolution_description
        )
    
    def get_open_alerts(self, page=1, per_page=20):
        """Get open alerts
        
        Args:
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated open alert list
        """
        return Alert.query.filter_by(status='open').order_by(
            Alert.severity.desc(), Alert.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)