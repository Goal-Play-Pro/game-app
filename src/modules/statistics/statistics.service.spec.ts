import { StatisticsService } from './statistics.service';

const createRepo = () => ({
  count: jest.fn(),
  find: jest.fn(),
});

describe('StatisticsService', () => {
  let service: StatisticsService;
  let userRepository: ReturnType<typeof createRepo>;
  let sessionRepository: ReturnType<typeof createRepo>;
  let orderRepository: ReturnType<typeof createRepo>;

  beforeEach(() => {
    userRepository = createRepo();
    sessionRepository = createRepo();
    orderRepository = createRepo();

    service = new StatisticsService(
      userRepository as any,
      sessionRepository as any,
      orderRepository as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGlobalStatistics', () => {
    it('returns aggregated stats when repositories succeed', async () => {
      userRepository.count
        .mockResolvedValueOnce(50) // total users
        .mockResolvedValueOnce(12); // active users
      sessionRepository.count
        .mockResolvedValueOnce(200) // total games
        .mockResolvedValueOnce(80); // completed games
      orderRepository.count.mockResolvedValueOnce(30);
      orderRepository.find.mockResolvedValueOnce([
        { totalPriceUSDT: '10.00' },
        { totalPriceUSDT: '5.50' },
      ]);

      const result = await service.getGlobalStatistics();

      expect(result).toEqual(
        expect.objectContaining({
          totalUsers: 50,
          activeUsers: 12,
          totalGames: 200,
          completedGames: 80,
          totalRewards: '15.50',
          successRate: '72.5',
        }),
      );

      expect(userRepository.count).toHaveBeenCalledTimes(2);
      expect(orderRepository.find).toHaveBeenCalledWith({ where: { status: 'fulfilled' } });
    });

    it('returns zeroed stats when an error occurs', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      userRepository.count.mockRejectedValueOnce(new Error('database down'));

      const result = await service.getGlobalStatistics();

      expect(result).toEqual({
        totalUsers: 0,
        activeUsers: 0,
        totalGames: 0,
        totalRewards: '0.00',
        completedGames: 0,
        averageSessionTime: '0 minutes',
        successRate: '0',
      });

      expect(errorSpy).toHaveBeenCalledWith('Error getting global statistics:', expect.any(Error));
      errorSpy.mockRestore();
    });
  });

  describe('getLeaderboard', () => {
    it('builds and ranks leaderboard entries', async () => {
      const users = [
        { id: 'user-1', walletAddress: '0xabc', metadata: { nickname: 'Alpha' } },
        { id: 'user-2', walletAddress: '0xdef', metadata: {} },
        { id: 'user-3', walletAddress: '0xghi', metadata: null },
      ];

      userRepository.find.mockResolvedValue(users);
      const sessionMap: Record<string, any[]> = {
        'user-1': [
          { winnerId: 'user-1' },
          { winnerId: 'user-1' },
        ],
        'user-2': [
          { winnerId: 'user-1' },
          { winnerId: 'user-2' },
        ],
        'user-3': [],
      };
      sessionRepository.find.mockImplementation(({ where }) => {
        const [{ hostUserId, guestUserId }] = where as any[];
        const userId = hostUserId ?? guestUserId;
        return Promise.resolve(sessionMap[userId] || []);
      });

      const result = await service.getLeaderboard();

      expect(result).toHaveLength(2); // user-3 filtered out (no games)
      expect(result[0]).toEqual(
        expect.objectContaining({
          userId: 'user-1',
          rank: 1,
          wins: 2,
          totalRewards: '50.00',
          username: 'Alpha',
        }),
      );
      expect(result[1]).toEqual(
        expect.objectContaining({
          userId: 'user-2',
          rank: 2,
          wins: 1,
          totalRewards: '25.00',
          username: expect.stringContaining('Player'),
        }),
      );
    });

    it('returns empty array on repository failure', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      userRepository.find.mockRejectedValueOnce(new Error('boom'));

      await expect(service.getLeaderboard()).resolves.toEqual([]);

      expect(errorSpy).toHaveBeenCalledWith('Error getting leaderboard:', expect.any(Error));
      errorSpy.mockRestore();
    });
  });
});
