/**
 * ID Generator Utility
 * Generates unique IDs for entities
 */

class IdGenerator {
  static generateShipmentId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `SHP-${year}-${random}`;
  }

  static generateEventId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `EVT-${year}-${random}`;
  }

  static generateAlertId() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `ALT-${year}-${random}`;
  }
}

module.exports = IdGenerator;
