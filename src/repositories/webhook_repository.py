"""Webhook Repository

Handles database operations for Webhook entity.
"""

from src.repositories.base_repository import BaseRepository
from src.models.webhook import Webhook
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class WebhookRepository(BaseRepository):
    """Repository for Webhook entity"""
    
    def __init__(self):
        super().__init__(Webhook)
    
    def get_active_webhooks(self, page=1, per_page=20):
        """Get active webhooks
        
        Args:
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated active webhook list
        """
        return Webhook.query.filter_by(is_active=True).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    def get_by_event_type(self, event_type):
        """Get webhooks subscribed to specific event type
        
        Args:
            event_type: Event type
            
        Returns:
            List of webhook instances
        """
        return Webhook.query.filter(
            Webhook.is_active == True,
            Webhook.event_types.contains([event_type])
        ).all()
    
    def update_last_triggered(self, webhook_id, success=True):
        """Update webhook last triggered timestamp
        
        Args:
            webhook_id: Webhook ID
            success: Whether the trigger was successful
            
        Returns:
            Updated webhook instance
        """
        update_data = {'last_triggered_at': datetime.utcnow()}
        
        if success:
            update_data['last_success_at'] = datetime.utcnow()
            update_data['failure_count'] = 0
        else:
            update_data['last_failure_at'] = datetime.utcnow()
            webhook = self.get_by_id(webhook_id)
            if webhook:
                update_data['failure_count'] = webhook.failure_count + 1
        
        return self.update(webhook_id, **update_data)
    
    def deactivate_webhook(self, webhook_id):
        """Deactivate a webhook
        
        Args:
            webhook_id: Webhook ID
            
        Returns:
            Updated webhook instance
        """
        return self.update(webhook_id, is_active=False)