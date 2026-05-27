const crypto = require('crypto');
const encryptionConfig = require('../config/encryption');
const logger = require('./logger');

/**
 * AES-256-GCM Encryption Utility
 * Provides encrypt/decrypt functions for sensitive data
 */
class EncryptionUtil {
  constructor() {
    if (!encryptionConfig.masterKey) {
      throw new Error('ENCRYPTION_MASTER_KEY environment variable is required');
    }
    this.masterKey = Buffer.from(encryptionConfig.masterKey, 'hex');
  }

  /**
   * Derive encryption key from master key using PBKDF2
   */
  deriveKey(salt) {
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      encryptionConfig.iterations,
      encryptionConfig.keyLength,
      encryptionConfig.digest
    );
  }

  /**
   * Encrypt data using AES-256-GCM
   * @param {string} plaintext - Data to encrypt
   * @returns {string} Encrypted data in format: salt:iv:tag:ciphertext (hex encoded)
   */
  encrypt(plaintext) {
    try {
      if (!plaintext) return null;

      // Generate random salt and IV
      const salt = crypto.randomBytes(encryptionConfig.saltLength);
      const iv = crypto.randomBytes(encryptionConfig.ivLength);

      // Derive key from master key
      const key = this.deriveKey(salt);

      // Create cipher
      const cipher = crypto.createCipheriv(
        encryptionConfig.algorithm,
        key,
        iv
      );

      // Encrypt data
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine all components
      const encrypted = [
        salt.toString('hex'),
        iv.toString('hex'),
        tag.toString('hex'),
        ciphertext
      ].join(':');

      return encrypted;
    } catch (error) {
      logger.error('Encryption error:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * @param {string} encrypted - Encrypted data in format: salt:iv:tag:ciphertext
   * @returns {string} Decrypted plaintext
   */
  decrypt(encrypted) {
    try {
      if (!encrypted) return null;

      // Split components
      const parts = encrypted.split(':');
      if (parts.length !== 4) {
        throw new Error('Invalid encrypted data format');
      }

      const [saltHex, ivHex, tagHex, ciphertext] = parts;

      // Convert from hex
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');

      // Derive key
      const key = this.deriveKey(salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(
        encryptionConfig.algorithm,
        key,
        iv
      );

      // Set authentication tag
      decipher.setAuthTag(tag);

      // Decrypt data
      let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      logger.error('Decryption error:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Encrypt object fields based on configuration
   * @param {Object} data - Object with fields to encrypt
   * @returns {Object} Object with encrypted fields
   */
  encryptObject(data) {
    if (!data || typeof data !== 'object') return data;

    const encrypted = { ...data };

    for (const field of encryptionConfig.encryptedFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(String(encrypted[field]));
      }
    }

    return encrypted;
  }

  /**
   * Decrypt object fields
   * @param {Object} data - Object with encrypted fields
   * @returns {Object} Object with decrypted fields
   */
  decryptObject(data) {
    if (!data || typeof data !== 'object') return data;

    const decrypted = { ...data };

    for (const field of encryptionConfig.encryptedFields) {
      if (decrypted[field]) {
        try {
          decrypted[field] = this.decrypt(decrypted[field]);
        } catch (error) {
          logger.warn(`Failed to decrypt field ${field}`);
        }
      }
    }

    return decrypted;
  }

  /**
   * Hash data using SHA-256 (for non-reversible hashing)
   * @param {string} data - Data to hash
   * @returns {string} Hex-encoded hash
   */
  hash(data) {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Generate secure random token
   * @param {number} length - Token length in bytes
   * @returns {string} Hex-encoded random token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionUtil();