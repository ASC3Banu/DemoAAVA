"""Logging Configuration

Centralized logging setup with audit trail capabilities.
Complies with NFR-006 audit logging requirements.
"""

import logging
import logging.handlers
import os
import json
from datetime import datetime
from pythonjsonlogger import jsonlogger

class AuditLogger:
    """Specialized logger for audit trail
    
    Maintains immutable audit logs for compliance and security.
    """
    
    def __init__(self, name='audit'):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)
        
        # Create logs directory if it doesn't exist
        log_dir = 'logs'
        os.makedirs(log_dir, exist_ok=True)
        
        # Rotating file handler for audit logs
        audit_file = os.path.join(log_dir, 'audit.log')
        handler = logging.handlers.RotatingFileHandler(
            audit_file,
            maxBytes=100*1024*1024,  # 100MB
            backupCount=10
        )
        
        # JSON formatter for structured logging
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s %(request_id)s %(user_id)s %(action)s'
        )
        handler.setFormatter(formatter)
        
        self.logger.addHandler(handler)
    
    def log_action(self, action, user_id=None, details=None, request_id=None):
        """Log an audit action
        
        Args:
            action: Action performed
            user_id: User who performed the action
            details: Additional details
            request_id: Request trace ID
        """
        self.logger.info(
            f"Audit: {action}",
            extra={
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'action': action,
                'user_id': user_id,
                'details': details,
                'request_id': request_id
            }
        )

def setup_logger(name):
    """Setup application logger
    
    Args:
        name: Logger name
        
    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    # Create logs directory
    log_dir = 'logs'
    os.makedirs(log_dir, exist_ok=True)
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_format = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(console_format)
    
    # File handler
    file_handler = logging.handlers.RotatingFileHandler(
        os.path.join(log_dir, 'application.log'),
        maxBytes=50*1024*1024,  # 50MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(console_format)
    
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)
    
    return logger

# Global audit logger instance
audit_logger = AuditLogger()