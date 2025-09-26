import { StatisticsController } from './statistics.controller';

const mockStatisticsService = () => ({
  getGlobalStatistics: jest.fn(),
  getLeaderboard: jest.fn(),
});

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let service: ReturnType<typeof mockStatisticsService>;

  beforeEach(() => {
    service = mockStatisticsService();
    controller = new StatisticsController(service as any);
  });

  it('returns global statistics from service', async () => {
    service.getGlobalStatistics.mockResolvedValue({ totalUsers: 10 });

    const result = await controller.getGlobalStatistics();

    expect(service.getGlobalStatistics).toHaveBeenCalled();
    expect(result).toEqual({ totalUsers: 10 });
  });

  it('returns leaderboard data from service', async () => {
    service.getLeaderboard.mockResolvedValue([{ userId: 'u1' }]);

    const result = await controller.getLeaderboard();

    expect(service.getLeaderboard).toHaveBeenCalled();
    expect(result).toEqual([{ userId: 'u1' }]);
  });
});
