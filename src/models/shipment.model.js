class Shipment {
  constructor(data) {
    this.id = data.id;
    this.trackingNumber = data.tracking_number;
    this.originLocation = data.origin_location;
    this.destinationLocation = data.destination_location;
    this.currentLocation = data.current_location;
    this.status = data.status;
    this.transportMode = data.transport_mode;
    this.carrierId = data.carrier_id;
    this.estimatedDelivery = data.estimated_delivery;
    this.actualDelivery = data.actual_delivery;
    this.cargoDetails = data.cargo_details;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
    this.createdBy = data.created_by;
  }

  static fromDatabase(row) {
    return new Shipment(row);
  }

  toJSON() {
    return {
      shipment_id: this.id,
      tracking_number: this.trackingNumber,
      origin_location: this.originLocation,
      destination_location: this.destinationLocation,
      current_location: this.currentLocation,
      status: this.status,
      transport_mode: this.transportMode,
      carrier_id: this.carrierId,
      estimated_delivery: this.estimatedDelivery,
      actual_delivery: this.actualDelivery,
      cargo_details: this.cargoDetails,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  isDelayed() {
    if (!this.estimatedDelivery) return false;
    const now = new Date();
    const estimated = new Date(this.estimatedDelivery);
    return now > estimated && this.status !== 'delivered';
  }

  calculateProgress() {
    const statusProgress = {
      'created': 10,
      'picked_up': 25,
      'in_transit': 50,
      'customs_clearance': 75,
      'out_for_delivery': 90,
      'delivered': 100,
      'delayed': 50,
      'cancelled': 0
    };
    return statusProgress[this.status] || 0;
  }
}

module.exports = Shipment;
