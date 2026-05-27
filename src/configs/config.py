"""Application Configuration

Centralized configuration management with environment-specific settings.
Supports development, testing, and production environments.
"""

import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    
    # API Information
    API_TITLE = 'AI-Powered Logistics Monitoring System API'
    API_VERSION = '1.0.0'
    
    # Security Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://user:password@localhost:5432/logistics_db'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = os.getenv('SQL_ECHO', 'False').lower() == 'true'
    
    # Redis Configuration (for caching and rate limiting)
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # CORS Configuration
    ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', '*').split(',')
    
    # Encryption Configuration
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', 'your-aes-256-encryption-key-32-bytes!!')
    
    # AWS Configuration (for S3, KMS, etc.)
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
    
    # Logging Configuration
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_DEFAULT = "10000 per second"
    
    # Performance Targets (NFR-018 to NFR-020)
    TARGET_RESPONSE_TIME_P95 = 200  # milliseconds
    TARGET_RESPONSE_TIME_P99 = 500  # milliseconds
    TARGET_DASHBOARD_LOAD_TIME = 3000  # milliseconds
    TARGET_AI_INFERENCE_TIME = 2000  # milliseconds
    TARGET_EVENT_PROCESSING_LATENCY = 5000  # milliseconds
    
    # Scalability Targets (NFR-026 to NFR-030)
    TARGET_THROUGHPUT = 10000  # requests per second
    TARGET_CONCURRENT_USERS = 50000
    
    # Availability Targets (NFR-031 to NFR-035)
    TARGET_SYSTEM_UPTIME = 99.9  # percentage
    TARGET_SERVICE_AVAILABILITY = 99.95  # percentage
    TARGET_DATABASE_AVAILABILITY = 99.99  # percentage
    
    # Compliance Configuration
    ENABLE_GDPR_COMPLIANCE = True
    ENABLE_PCI_DSS_COMPLIANCE = True
    ENABLE_AUDIT_LOGGING = True
    AUDIT_LOG_RETENTION_DAYS = 2555  # 7 years for compliance
    
    # PII/PHI/PCI Data Protection
    PII_FIELDS = ['email', 'phone', 'address', 'ssn', 'tax_id']
    PHI_FIELDS = ['medical_info', 'health_data']
    PCI_FIELDS = ['card_number', 'cvv', 'card_expiry']
    
    # Multi-Factor Authentication
    ENABLE_MFA = os.getenv('ENABLE_MFA', 'True').lower() == 'true'
    MFA_CODE_LENGTH = 6
    MFA_CODE_EXPIRY_SECONDS = 300  # 5 minutes
    
    # AI/ML Model Configuration
    ML_MODEL_PATH = os.getenv('ML_MODEL_PATH', '/models/delay_prediction_model.pkl')
    ML_MODEL_VERSION = os.getenv('ML_MODEL_VERSION', '1.0.0')
    ML_INFERENCE_TIMEOUT = 2  # seconds
    
    # External Integration Configuration
    WEBHOOK_TIMEOUT = 30  # seconds
    WEBHOOK_RETRY_ATTEMPTS = 3
    WEBHOOK_RETRY_DELAY = 5  # seconds
    
    # Pagination Defaults
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100

class DevelopmentConfig(Config):
    """Development environment configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    LOG_LEVEL = 'DEBUG'

class TestingConfig(Config):
    """Testing environment configuration"""
    DEBUG = False
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

class ProductionConfig(Config):
    """Production environment configuration"""
    DEBUG = False
    TESTING = False
    
    # Ensure critical secrets are set in production
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Log to syslog in production
        import logging
        from logging.handlers import SysLogHandler
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler)

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}