class Alert {
  constructor(data) {
    this.id = data.id;
    this.shipmentId = data.shipment_id;
    this.alertType = data.alert_type;
    this.severity = data.severity;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status;
    this.acknowledgedBy = data.acknowledged_by;
    this.acknowledgedAt = data.acknowledged_at;
    this.resolvedBy = data.resolved_by;
    this.resolvedAt = data.resolved_at;
    this.metadata = data.metadata;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static fromDatabase(row) {
    return new Alert(row);
  }

  toJSON() {
    return {
      alert_id: this.id,
      shipment_id: this.shipmentId,
      alert_type: this.alertType,
      severity: this.severity,
      title: this.title,
      description: this.description,
      status: this.status,
      acknowledged_by: this.acknowledgedBy,
      acknowledged_at: this.acknowledgedAt,
      resolved_by: this.resolvedBy,
      resolved_at: this.resolvedAt,
      metadata: this.metadata,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  isActive() {
    return this.status === 'active' || this.status === 'acknowledged';
  }

  requiresEscalation() {
    const now = new Date();
    const createdTime = new Date(this.createdAt);
    const hoursSinceCreation = (now - createdTime) / (1000 * 60 * 60);

    const escalationThresholds = {
      'critical': 1,
      'high': 4,
      'medium': 12,
      'low': 24
    };

    return this.isActive() && 
           hoursSinceCreation > (escalationThresholds[this.severity] || 24);
  }
}

module.exports = Alert;
