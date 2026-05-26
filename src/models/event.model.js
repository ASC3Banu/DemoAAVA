class TrackingEvent {
  constructor(data) {
    this.id = data.id;
    this.shipmentId = data.shipment_id;
    this.eventType = data.event_type;
    this.eventData = data.event_data;
    this.location = data.location;
    this.timestamp = data.timestamp;
    this.source = data.source;
    this.metadata = data.metadata;
    this.createdAt = data.created_at;
  }

  static fromDatabase(row) {
    return new TrackingEvent(row);
  }

  toJSON() {
    return {
      event_id: this.id,
      shipment_id: this.shipmentId,
      event_type: this.eventType,
      event_data: this.eventData,
      location: this.location,
      timestamp: this.timestamp,
      source: this.source,
      metadata: this.metadata,
      created_at: this.createdAt
    };
  }

  isCritical() {
    const criticalEvents = [
      'delay_detected',
      'route_deviation',
      'customs_issue',
      'carrier_problem',
      'damage_reported'
    ];
    return criticalEvents.includes(this.eventType);
  }
}

module.exports = TrackingEvent;
