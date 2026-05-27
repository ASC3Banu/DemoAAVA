const validator = require('validator');

class DataSanitizer {
  sanitizeInput(req, res, next) {
    if (req.body) {
      req.body = this.sanitizeObject(req.body);
    }

    if (req.query) {
      req.query = this.sanitizeObject(req.query);
    }

    if (req.params) {
      req.params = this.sanitizeObject(req.params);
    }

    next();
  }

  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          sanitized[key] = this.sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized;
  }

  sanitizeString(str) {
    let sanitized = validator.escape(str);
    sanitized = validator.trim(sanitized);
    sanitized = validator.stripLow(sanitized);
    return sanitized;
  }

  maskPII(data) {
    const piiPatterns = {
      email: /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g
    };

    let masked = JSON.stringify(data);

    masked = masked.replace(piiPatterns.email, (match, user, domain) => {
      return `${user.substring(0, 2)}***@${domain}`;
    });

    masked = masked.replace(piiPatterns.phone, '***-***-****');
    masked = masked.replace(piiPatterns.ssn, '***-**-****');
    masked = masked.replace(piiPatterns.creditCard, '**** **** **** ****');

    return JSON.parse(masked);
  }
}

module.exports = new DataSanitizer();