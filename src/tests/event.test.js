/**
 * Event Service Tests
 * Unit tests for event operations
 */

const eventService = require('../services/event.service');
const eventRepository = require('../repositories/event.repository');

jest.mock('../repositories/event.repository');
jest.mock('../configs/kafka.config');

describe('Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createEvent', () => {
    it('should create an event successfully', async () => {
      const mockEventData = {
        shipment_id: 'SHP-2024-001234',
        event_type: 'departure',
        event_time: '2024-12-15T10:15:00Z',
        location: 'New York Port, NY',
        details: 'Container loaded and departed',
        userId: 'user-123',
        organizationId: 'org-123'
      };

      const mockCreatedEvent = {
        event_id: 'EVT-2024-567890',
        ...mockEventData,
        created_at: new Date()
      };

      eventRepository.create.mockResolvedValue(mockCreatedEvent);

      const result = await eventService.createEvent(mockEventData);

      expect(result).toBeDefined();
      expect(result.event_id).toMatch(/^EVT-[0-9]{4}-[0-9]{6}$/);
      expect(eventRepository.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('listEvents', () => {
    it('should list events with filters', async () => {
      const mockEvents = {
        data: [
          {
            event_id: 'EVT-2024-567890',
            shipment_id: 'SHP-2024-001234',
            event_type: 'departure'
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1
        }
      };

      eventRepository.findAll.mockResolvedValue(mockEvents);

      const result = await eventService.listEvents(
        { organizationId: 'org-123', shipment_id: 'SHP-2024-001234' },
        { page: 1, limit: 50 }
      );

      expect(result).toEqual(mockEvents);
      expect(result.data).toHaveLength(1);
    });
  });
});
