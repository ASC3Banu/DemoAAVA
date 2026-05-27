const trackingService = require('../../../services/trackingService');
const shipmentRepository = require('../../../repositories/shipmentRepository');
const { cacheHelper } = require('../../../config/redis');

jest.mock('../../../repositories/shipmentRepository');
jest.mock('../../../config/redis');
jest.mock('../../../config/kafka');

describe('TrackingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createShipment', () => {
    it('should create a shipment successfully', async () => {
      const mockShipment = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        tracking_number: 'SHIP123456',
        status: 'created'
      };

      shipmentRepository.create.mockResolvedValue(mockShipment);
      cacheHelper.set.mockResolvedValue(true);

      const result = await trackingService.createShipment({ tracking_number: 'SHIP123456' }, 'user123');

      expect(result).toEqual(mockShipment);
      expect(shipmentRepository.create).toHaveBeenCalledWith({ tracking_number: 'SHIP123456' }, 'user123');
      expect(cacheHelper.set).toHaveBeenCalled();
    });

    it('should handle errors during shipment creation', async () => {
      shipmentRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(trackingService.createShipment({}, 'user123')).rejects.toThrow('Database error');
    });
  });

  describe('getShipment', () => {
    it('should return cached shipment if available', async () => {
      const mockShipment = { id: '123', tracking_number: 'SHIP123' };
      cacheHelper.get.mockResolvedValue(mockShipment);

      const result = await trackingService.getShipment('123');

      expect(result).toEqual(mockShipment);
      expect(shipmentRepository.findById).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      const mockShipment = { id: '123', tracking_number: 'SHIP123' };
      cacheHelper.get.mockResolvedValue(null);
      shipmentRepository.findById.mockResolvedValue(mockShipment);
      cacheHelper.set.mockResolvedValue(true);

      const result = await trackingService.getShipment('123');

      expect(result).toEqual(mockShipment);
      expect(shipmentRepository.findById).toHaveBeenCalledWith('123');
      expect(cacheHelper.set).toHaveBeenCalled();
    });
  });
});