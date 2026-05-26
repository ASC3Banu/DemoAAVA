const shipmentService = require('../../services/shipment.service');
const shipmentRepository = require('../../repositories/shipment.repository');
const eventRepository = require('../../repositories/event.repository');

jest.mock('../../repositories/shipment.repository');
jest.mock('../../repositories/event.repository');
jest.mock('../../configs/kafka.config');
jest.mock('../../configs/redis.config');

describe('ShipmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createShipment', () => {
    it('should create a new shipment successfully', async () => {
      const mockShipmentData = {
        tracking_number: 'TEST123',
        origin_location: 'New York',
        destination_location: 'London',
        transport_mode: 'air',
        carrier_id: 'CARRIER001'
      };

      const mockShipment = {
        id: '123',
        ...mockShipmentData,
        toJSON: () => mockShipmentData
      };

      shipmentRepository.findByTrackingNumber.mockResolvedValue(null);
      shipmentRepository.create.mockResolvedValue(mockShipment);
      eventRepository.create.mockResolvedValue({});

      const result = await shipmentService.createShipment(mockShipmentData, 'user123');

      expect(result).toBeDefined();
      expect(shipmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: 'user123' })
      );
    });

    it('should throw ConflictError if tracking number exists', async () => {
      const mockShipmentData = {
        tracking_number: 'EXISTING123'
      };

      shipmentRepository.findByTrackingNumber.mockResolvedValue({ id: '456' });

      await expect(
        shipmentService.createShipment(mockShipmentData, 'user123')
      ).rejects.toThrow('Shipment with this tracking number already exists');
    });
  });

  describe('getShipmentById', () => {
    it('should retrieve shipment by ID', async () => {
      const mockShipment = {
        id: '123',
        tracking_number: 'TEST123',
        toJSON: () => ({ id: '123' })
      };

      shipmentRepository.findById.mockResolvedValue(mockShipment);

      const result = await shipmentService.getShipmentById('123');

      expect(result).toBeDefined();
      expect(shipmentRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundError if shipment does not exist', async () => {
      shipmentRepository.findById.mockResolvedValue(null);

      await expect(
        shipmentService.getShipmentById('nonexistent')
      ).rejects.toThrow('Shipment not found');
    });
  });
});
