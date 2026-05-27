const { pgPool } = require('../config/database');
const { publishEvent, TOPICS } = require('../config/kafka');

class AuditLogger {
  async log(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(data) {
      res.send = originalSend;
      const responseTime = Date.now() - startTime;

      const auditEntry = {
        timestamp: new Date().toISOString(),
        userId: req.user?.id || 'anonymous',
        userEmail: req.user?.email || 'anonymous',
        method: req.method,
        path: req.path,
        query: JSON.stringify(req.query),
        body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
        statusCode: res.statusCode,
        responseTime,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        correlationId: req.headers['x-correlation-id'] || `${Date.now()}-${Math.random()}`
      };

      AuditLogger.saveAuditLog(auditEntry).catch(err => {
        console.error('Failed to save audit log:', err);
      });

      return res.send(data);
    };

    next();
  }

  static async saveAuditLog(entry) {
    try {
      const query = `
        INSERT INTO audit_logs (
          timestamp, user_id, user_email, method, path, query_params,
          request_body, status_code, response_time, ip_address,
          user_agent, correlation_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;

      await pgPool.query(query, [
        entry.timestamp,
        entry.userId,
        entry.userEmail,
        entry.method,
        entry.path,
        entry.query,
        entry.body,
        entry.statusCode,
        entry.responseTime,
        entry.ip,
        entry.userAgent,
        entry.correlationId
      ]);

      if (entry.statusCode >= 400) {
        await publishEvent(TOPICS.ALERT_CREATED, {
          type: 'api_error',
          severity: entry.statusCode >= 500 ? 'high' : 'medium',
          message: `API error: ${entry.method} ${entry.path} returned ${entry.statusCode}`,
          metadata: entry
        });
      }
    } catch (error) {
      console.error('Failed to save audit log to database:', error);
    }
  }

  static async logDataAccess(userId, resourceType, resourceId, action) {
    try {
      const query = `
        INSERT INTO data_access_logs (
          timestamp, user_id, resource_type, resource_id, action
        ) VALUES ($1, $2, $3, $4, $5)
      `;

      await pgPool.query(query, [
        new Date().toISOString(),
        userId,
        resourceType,
        resourceId,
        action
      ]);
    } catch (error) {
      console.error('Failed to log data access:', error);
    }
  }
}

module.exports = new AuditLogger();