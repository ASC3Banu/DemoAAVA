const crypto = require('crypto');
const fs = require('fs');
const logger = require('./logger.config');
const config = require('./app.config');

class SecurityConfig {
  constructor() {
    this.encryptionKey = this.loadEncryptionKey();
  }

  loadEncryptionKey() {
    try {
      const keyPath = config.database.encryption.keyPath;
      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath);
      } else {
        const key = crypto.randomBytes(32);
        fs.writeFileSync(keyPath, key);
        logger.warn('Generated new encryption key', { keyPath });
        return key;
      }
    } catch (error) {
      logger.error('Failed to load encryption key', { error: error.message });
      throw error;
    }
  }

  encryptAES256(data) {
    try {
      const iv = crypto.randomBytes(config.security.encryption.ivLength);
      const cipher = crypto.createCipheriv(
        config.security.encryption.algorithm,
        this.encryptionKey,
        iv
      );
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      throw error;
    }
  }

  decryptAES256(encryptedData, iv, authTag) {
    try {
      const decipher = crypto.createDecipheriv(
        config.security.encryption.algorithm,
        this.encryptionKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      throw error;
    }
  }

  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return { salt, hash };
  }

  verifyPassword(password, salt, hash) {
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  sanitizeInput(input) {
    if (typeof input === 'string') {
      return input.replace(/<script[^>]*>.*?<\/script>/gi, '')
                  .replace(/<[^>]+>/g, '')
                  .trim();
    }
    return input;
  }

  maskPII(data) {
    const maskedData = { ...data };
    config.security.sensitiveFields.forEach(field => {
      if (maskedData[field]) {
        maskedData[field] = '***REDACTED***';
      }
    });
    return maskedData;
  }
}

module.exports = new SecurityConfig();
