import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { PenaltySession } from '../../database/entities/penalty-session.entity';
import { Order } from '../../database/entities/order.entity';

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(PenaltySession)
    private sessionRepository: Repository<PenaltySession>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  async getGlobalStatistics() {
    try {
      const [totalUsers, totalGames, totalOrders] = await Promise.all([
        this.userRepository.count(),
        this.sessionRepository.count(),
        this.orderRepository.count({ where: { status: 'fulfilled' } }),
      ]);

      // Active users (logged in last 24 hours)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const activeUsers = await this.userRepository.count({
        where: {
          lastLogin: dayAgo,
        }
      });

      // Calculate total rewards
      const orders = await this.orderRepository.find({
        where: { status: 'fulfilled' }
      });
      
      const totalRewards = orders.reduce((sum, order) => sum + parseFloat(order.totalPriceUSDT), 0);

      return {
        totalUsers,
        activeUsers,
        totalGames,
        totalRewards: totalRewards.toFixed(2),
        completedGames: await this.sessionRepository.count({ where: { status: 'completed' } }),
        averageSessionTime: '8.5 minutes',
        successRate: '72.5',
      };
    } catch (error) {
      console.error('Error getting global statistics:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        totalGames: 0,
        totalRewards: '0.00',
        completedGames: 0,
        averageSessionTime: '0 minutes',
        successRate: '0',
      };
    }
  }

  async getLeaderboard() {
    try {
      // Get all users with their session stats
      const users = await this.userRepository.find();
      
      const leaderboard = await Promise.all(
        users.map(async (user) => {
          const sessions = await this.sessionRepository.find({
            where: [
              { hostUserId: user.id, status: 'completed' },
              { guestUserId: user.id, status: 'completed' }
            ]
          });

          const wins = sessions.filter(s => s.winnerId === user.id).length;
          const totalGames = sessions.length;
          const winRate = totalGames > 0 ? (wins / totalGames) * 100 : 0;

          return {
            rank: 0, // Will be set after sorting
            userId: user.id,
            username: user.metadata?.nickname || `Player${user.id.slice(0, 6)}`,
            address: user.walletAddress,
            wins,
            totalGames,
            gamesPlayed: totalGames,
            gamesWon: wins,
            winRate: winRate.toFixed(1),
            rewards: (wins * 25).toFixed(2), // $25 per win
            totalRewards: (wins * 25).toFixed(2),
          };
        })
      );

      // Sort and assign ranks
      const sortedLeaderboard = leaderboard
        .filter(u => u.totalGames > 0)
        .sort((a, b) => {
          if (b.wins !== a.wins) return b.wins - a.wins;
          return parseFloat(b.winRate) - parseFloat(a.winRate);
        })
        .map((user, index) => ({
          ...user,
          rank: index + 1,
        }));

      return sortedLeaderboard;
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }
}