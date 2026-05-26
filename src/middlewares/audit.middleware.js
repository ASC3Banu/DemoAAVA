/**
 * Audit Middleware
 * Comprehensive audit logging for all API operations
 * 
 * Compliance: Audit trail, data lineage tracking
 */

const logger = require('../utils/logger');
const db = require('../configs/database.config').pool;

const auditLogger = async (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    const auditLog = {
      request_id: req.id,
      user_id: req.user?.id || 'anonymous',
      organization_id: req.user?.organizationId || null,
      method: req.method,
      path: req.path,
      status_code: res.statusCode,
      duration_ms: duration,
      ip_address: req.ip,
      user_agent: req.headers['user-agent'],
      timestamp: new Date()
    };

    try {
      await db.query(
        `INSERT INTO audit_logs 
         (request_id, user_id, organization_id, method, path, status_code, duration_ms, ip_address, user_agent, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        Object.values(auditLog)
      );
    } catch (error) {
      logger.error('Error writing audit log:', error);
    }

    logger.info('API Request', auditLog);
  });

  next();
};

module.exports = { auditLogger };
