const fs = require('fs');
const path = require('path');
const logger = require('../configs/logger.config');
const security = require('../configs/security.config');

class AuditMiddleware {
  constructor() {
    this.auditLogPath = process.env.AUDIT_LOG_PATH || './logs/audit.log';
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const dir = path.dirname(this.auditLogPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  middleware(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      const auditEntry = {
        timestamp: new Date().toISOString(),
        requestId: req.id,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.id || 'anonymous',
        userRole: req.user?.role || 'none',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: security.maskPII(req.body || {}),
        query: req.query || {},
        params: req.params || {}
      };

      this.writeAuditLog(auditEntry);
      
      if (this.isSensitiveOperation(req)) {
        logger.info('Sensitive operation performed', {
          operation: `${req.method} ${req.path}`,
          userId: auditEntry.userId,
          statusCode: auditEntry.statusCode
        });
      }
    });

    next();
  }

  writeAuditLog(entry) {
    try {
      const logLine = JSON.stringify(entry) + '\n';
      fs.appendFileSync(this.auditLogPath, logLine, 'utf8');
    } catch (error) {
      logger.error('Failed to write audit log', { error: error.message });
    }
  }

  isSensitiveOperation(req) {
    const sensitivePaths = [
      '/api/v1/shipments',
      '/api/v1/predictions',
      '/api/v1/alerts'
    ];
    
    const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
    
    return sensitivePaths.some(path => req.path.startsWith(path)) &&
           sensitiveMethods.includes(req.method);
  }

  async getAuditLogs(filters = {}) {
    try {
      const logs = fs.readFileSync(this.auditLogPath, 'utf8')
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));

      let filtered = logs;

      if (filters.userId) {
        filtered = filtered.filter(log => log.userId === filters.userId);
      }

      if (filters.startDate) {
        filtered = filtered.filter(log => new Date(log.timestamp) >= new Date(filters.startDate));
      }

      if (filters.endDate) {
        filtered = filtered.filter(log => new Date(log.timestamp) <= new Date(filters.endDate));
      }

      if (filters.method) {
        filtered = filtered.filter(log => log.method === filters.method);
      }

      return filtered;
    } catch (error) {
      logger.error('Failed to read audit logs', { error: error.message });
      throw error;
    }
  }
}

const auditMiddleware = new AuditMiddleware();
module.exports = auditMiddleware.middleware.bind(auditMiddleware);
module.exports.getAuditLogs = auditMiddleware.getAuditLogs.bind(auditMiddleware);
