/**
 * Shipment Service Tests
 * Unit tests for shipment operations
 */

const shipmentService = require('../services/shipment.service');
const shipmentRepository = require('../repositories/shipment.repository');

jest.mock('../repositories/shipment.repository');
jest.mock('../configs/kafka.config');
jest.mock('../configs/redis.config');

describe('Shipment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createShipment', () => {
    it('should create a shipment successfully', async () => {
      const mockShipmentData = {
        origin: 'New York, NY',
        destination: 'London, UK',
        departure_time: '2024-12-15T10:00:00Z',
        arrival_time: '2024-12-16T14:30:00Z',
        userId: 'user-123',
        organizationId: 'org-123'
      };

      const mockCreatedShipment = {
        shipment_id: 'SHP-2024-001234',
        ...mockShipmentData,
        status: 'created',
        created_at: new Date(),
        updated_at: new Date()
      };

      shipmentRepository.create.mockResolvedValue(mockCreatedShipment);

      const result = await shipmentService.createShipment(mockShipmentData);

      expect(result).toBeDefined();
      expect(result.shipment_id).toMatch(/^SHP-[0-9]{4}-[0-9]{6}$/);
      expect(shipmentRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should handle creation errors', async () => {
      const mockShipmentData = {
        origin: 'New York, NY',
        destination: 'London, UK',
        departure_time: '2024-12-15T10:00:00Z',
        arrival_time: '2024-12-16T14:30:00Z',
        userId: 'user-123',
        organizationId: 'org-123'
      };

      shipmentRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(shipmentService.createShipment(mockShipmentData))
        .rejects.toThrow('Failed to create shipment');
    });
  });

  describe('getShipmentById', () => {
    it('should retrieve a shipment by ID', async () => {
      const mockShipment = {
        shipment_id: 'SHP-2024-001234',
        origin: 'New York, NY',
        destination: 'London, UK',
        status: 'in_transit',
        organizationId: 'org-123'
      };

      shipmentRepository.findById.mockResolvedValue(mockShipment);

      const result = await shipmentService.getShipmentById('SHP-2024-001234', 'org-123');

      expect(result).toEqual(mockShipment);
      expect(shipmentRepository.findById).toHaveBeenCalledWith('SHP-2024-001234', 'org-123');
    });

    it('should return null for non-existent shipment', async () => {
      shipmentRepository.findById.mockResolvedValue(null);

      const result = await shipmentService.getShipmentById('SHP-2024-999999', 'org-123');

      expect(result).toBeNull();
    });
  });
});
