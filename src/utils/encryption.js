const crypto = require('crypto');
const secretsManager = require('../config/secrets');

class EncryptionHelper {
  encryptField(value) {
    if (!value) return null;
    return secretsManager.encrypt(value.toString());
  }

  decryptField(encryptedData) {
    if (!encryptedData) return null;
    return secretsManager.decrypt(encryptedData);
  }

  hashData(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  encryptSensitiveFields(obj, fields) {
    const encrypted = { ...obj };
    
    fields.forEach(field => {
      if (encrypted[field]) {
        encrypted[field] = this.encryptField(encrypted[field]);
      }
    });

    return encrypted;
  }

  decryptSensitiveFields(obj, fields) {
    const decrypted = { ...obj };
    
    fields.forEach(field => {
      if (decrypted[field]) {
        decrypted[field] = this.decryptField(decrypted[field]);
      }
    });

    return decrypted;
  }
}

module.exports = new EncryptionHelper();