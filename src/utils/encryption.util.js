/**
 * Encryption Utility
 * AES-256 encryption for sensitive data
 * 
 * Security: AES-256-GCM encryption, secure key management
 */

const crypto = require('crypto');
const config = require('../configs/app.config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

class EncryptionUtil {
  static encryptSensitiveData(text) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const salt = crypto.randomBytes(SALT_LENGTH);
      
      const key = crypto.pbkdf2Sync(
        config.encryption.key,
        salt,
        100000,
        KEY_LENGTH,
        'sha512'
      );

      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();

      return Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]).toString('base64');
    } catch (error) {
      throw new Error('Encryption failed');
    }
  }

  static decryptSensitiveData(encryptedData) {
    try {
      const buffer = Buffer.from(encryptedData, 'base64');
      
      const salt = buffer.slice(0, SALT_LENGTH);
      const iv = buffer.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = buffer.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const encrypted = buffer.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

      const key = crypto.pbkdf2Sync(
        config.encryption.key,
        salt,
        100000,
        KEY_LENGTH,
        'sha512'
      );

      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed');
    }
  }
}

module.exports = EncryptionUtil;
