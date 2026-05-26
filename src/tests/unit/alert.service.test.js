const alertService = require('../../services/alert.service');
const alertRepository = require('../../repositories/alert.repository');
const shipmentRepository = require('../../repositories/shipment.repository');

jest.mock('../../repositories/alert.repository');
jest.mock('../../repositories/shipment.repository');
jest.mock('../../configs/kafka.config');

describe('AlertService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAlert', () => {
    it('should create alert successfully', async () => {
      const mockAlertData = {
        shipment_id: '123',
        alert_type: 'delay_prediction',
        severity: 'high',
        title: 'Delay Predicted',
        description: 'High probability of delay'
      };

      const mockAlert = {
        id: 'alert123',
        ...mockAlertData,
        toJSON: () => mockAlertData
      };

      shipmentRepository.findById.mockResolvedValue({ id: '123' });
      alertRepository.create.mockResolvedValue(mockAlert);

      const result = await alertService.createAlert(mockAlertData);

      expect(result).toBeDefined();
      expect(alertRepository.create).toHaveBeenCalledWith(mockAlertData);
    });

    it('should throw NotFoundError if shipment does not exist', async () => {
      const mockAlertData = {
        shipment_id: 'nonexistent'
      };

      shipmentRepository.findById.mockResolvedValue(null);

      await expect(
        alertService.createAlert(mockAlertData)
      ).rejects.toThrow('Shipment not found');
    });
  });

  describe('acknowledgeAlert', () => {
    it('should acknowledge alert successfully', async () => {
      const mockAlert = {
        id: 'alert123',
        status: 'acknowledged',
        toJSON: () => ({ id: 'alert123' })
      };

      alertRepository.acknowledge.mockResolvedValue(mockAlert);

      const result = await alertService.acknowledgeAlert('alert123', 'user123');

      expect(result).toBeDefined();
      expect(alertRepository.acknowledge).toHaveBeenCalledWith('alert123', 'user123');
    });
  });
});
