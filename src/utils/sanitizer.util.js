/**
 * Sanitizer Utility
 * Input sanitization and XSS prevention
 * 
 * Security: XSS prevention, SQL injection prevention
 */

const validator = require('validator');

class SanitizerUtil {
  static sanitizeInput(data) {
    if (typeof data === 'string') {
      return validator.escape(data.trim());
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  static filterPII(data) {
    const piiFields = ['ssn', 'credit_card', 'password', 'secret'];
    
    if (typeof data === 'object' && data !== null) {
      const filtered = { ...data };
      piiFields.forEach(field => {
        if (filtered[field]) {
          filtered[field] = '***REDACTED***';
        }
      });
      return filtered;
    }
    
    return data;
  }
}

module.exports = SanitizerUtil;
