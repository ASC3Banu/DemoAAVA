"""Main Application Entry Point

This module initializes the Flask application with all necessary configurations,
middleware, security features, and routes.
"""

import os
import logging
from datetime import datetime
from flask import Flask, request, jsonify, g
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.exceptions import HTTPException
import uuid

from src.configs.config import Config
from src.configs.database import init_db, db
from src.configs.security import init_security, require_auth, require_role
from src.configs.logger import setup_logger, audit_logger
from src.resources.auth_resource import auth_bp
from src.resources.shipment_resource import shipment_bp
from src.resources.event_resource import event_bp
from src.resources.prediction_resource import prediction_bp
from src.resources.alert_resource import alert_bp
from src.resources.dashboard_resource import dashboard_bp
from src.resources.integration_resource import integration_bp

# Initialize logger
logger = setup_logger(__name__)

def create_app(config_name='production'):
    """Application Factory Pattern
    
    Args:
        config_name: Configuration environment (development, testing, production)
        
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": app.config['ALLOWED_ORIGINS']}})
    
    # Rate limiting - 10,000 requests per second per client
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["10000 per second"],
        storage_uri=app.config['REDIS_URL']
    )
    
    # Initialize database
    init_db(app)
    
    # Initialize security
    init_security(app)
    
    # Request ID middleware
    @app.before_request
    def before_request():
        g.request_id = str(uuid.uuid4())
        g.start_time = datetime.utcnow()
        
        # Audit log for all requests
        audit_logger.info(f"Request started", extra={
            'request_id': g.request_id,
            'method': request.method,
            'path': request.path,
            'ip': request.remote_addr,
            'user_agent': request.user_agent.string
        })
    
    @app.after_request
    def after_request(response):
        # Calculate request duration
        if hasattr(g, 'start_time'):
            duration = (datetime.utcnow() - g.start_time).total_seconds() * 1000
            
            # Audit log for response
            audit_logger.info(f"Request completed", extra={
                'request_id': g.request_id,
                'status_code': response.status_code,
                'duration_ms': duration
            })
            
            # Add performance headers
            response.headers['X-Request-ID'] = g.request_id
            response.headers['X-Response-Time'] = f"{duration}ms"
        
        # Security headers
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        return response
    
    # Error handlers
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle HTTP exceptions"""
        response = {
            'error': {
                'code': e.name.upper().replace(' ', '_'),
                'message': e.description,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'traceId': g.get('request_id', 'unknown')
            }
        }
        
        audit_logger.error(f"HTTP Exception: {e.name}", extra={
            'request_id': g.get('request_id'),
            'status_code': e.code,
            'error': e.description
        })
        
        return jsonify(response), e.code
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle unexpected exceptions"""
        logger.exception(f"Unhandled exception: {str(e)}")
        
        response = {
            'error': {
                'code': 'INTERNAL_SERVER_ERROR',
                'message': 'An unexpected error occurred',
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'traceId': g.get('request_id', 'unknown')
            }
        }
        
        audit_logger.error(f"Unhandled exception", extra={
            'request_id': g.get('request_id'),
            'error': str(e)
        })
        
        return jsonify(response), 500
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for load balancers"""
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'version': app.config['API_VERSION']
        }), 200
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(shipment_bp, url_prefix='/api/v1/shipments')
    app.register_blueprint(event_bp, url_prefix='/api/v1/events')
    app.register_blueprint(prediction_bp, url_prefix='/api/v1/predictions')
    app.register_blueprint(alert_bp, url_prefix='/api/v1/alerts')
    app.register_blueprint(dashboard_bp, url_prefix='/api/v1/dashboard')
    app.register_blueprint(integration_bp, url_prefix='/api/v1/integrations')
    
    logger.info(f"Application initialized successfully in {config_name} mode")
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=os.getenv('HOST', '0.0.0.0'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('DEBUG', 'False').lower() == 'true'
    )