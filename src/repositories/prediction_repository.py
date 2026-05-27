"""Prediction Repository

Handles database operations for DelayPrediction entity.
"""

from src.repositories.base_repository import BaseRepository
from src.models.prediction import DelayPrediction
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PredictionRepository(BaseRepository):
    """Repository for DelayPrediction entity"""
    
    def __init__(self):
        super().__init__(DelayPrediction)
    
    def get_by_shipment(self, shipment_id, page=1, per_page=20):
        """Get predictions for a specific shipment
        
        Args:
            shipment_id: Shipment ID
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated prediction list
        """
        return DelayPrediction.query.filter_by(shipment_id=shipment_id).order_by(
            DelayPrediction.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
    
    def get_latest_prediction(self, shipment_id):
        """Get latest prediction for a shipment
        
        Args:
            shipment_id: Shipment ID
            
        Returns:
            Latest prediction instance or None
        """
        return DelayPrediction.query.filter_by(shipment_id=shipment_id).order_by(
            DelayPrediction.created_at.desc()
        ).first()
    
    def get_high_risk_predictions(self, threshold=0.7, page=1, per_page=20):
        """Get high-risk delay predictions
        
        Args:
            threshold: Probability threshold
            page: Page number
            per_page: Records per page
            
        Returns:
            Paginated high-risk prediction list
        """
        return DelayPrediction.query.filter(
            DelayPrediction.delay_probability >= threshold
        ).order_by(DelayPrediction.delay_probability.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
    
    def validate_prediction(self, prediction_id, actual_outcome):
        """Validate prediction with actual outcome
        
        Args:
            prediction_id: Prediction ID
            actual_outcome: Actual delay outcome (boolean)
            
        Returns:
            Updated prediction instance
        """
        status = 'validated' if actual_outcome else 'invalidated'
        return self.update(
            prediction_id,
            actual_outcome=actual_outcome,
            prediction_status=status,
            validated_at=datetime.utcnow()
        )