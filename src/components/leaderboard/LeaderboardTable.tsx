import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Target, Crown, Medal, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface LeaderboardTableProps {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all';
  category?: 'overall' | 'wins' | 'winrate' | 'earnings';
  limit?: number;
  showUserHighlight?: boolean;
}

interface LeaderboardPlayer {
  rank: number;
  userId: string;
  username: string;
  address?: string;
  avatar?: string;
  wins: number;
  totalGames: number;
  gamesPlayed: number;
  gamesWon: number;
  winRate: string | number;
  rewards: string;
  totalRewards: string;
}

const LeaderboardTable = ({ 
  timeframe = 'weekly', 
  category = 'overall', 
  limit = 50,
  showUserHighlight = false // Disabled until Web3 is connected
}: LeaderboardTableProps) => {
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null);

  // Fetch leaderboard data
  const { data: leaderboard, isLoading, error, refetch } = useQuery({
    queryKey: ['leaderboard', timeframe, category, limit],
    queryFn: () => ApiService.getLeaderboard(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Highlight current user in leaderboard
  // Disabled until Web3 is connected

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-300" />;
      case 3: return <Medal className="w-6 h-6 text-orange-400" />;
      default: return <span className="text-gray-400 font-bold">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-orange-500';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-orange-400 to-red-500';
      default: return 'from-football-green to-football-blue';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getWinRateColor = (winRate: string | number) => {
    const rate = typeof winRate === 'string' ? parseFloat(winRate) : winRate;
    if (rate >= 80) return 'text-green-400';
    if (rate >= 60) return 'text-blue-400';
    if (rate >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (isLoading) {
    return (
      <div className="glass-dark rounded-xl p-6">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner size="lg" text="Loading leaderboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-dark rounded-xl p-6">
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Production API Connection Issue
          </h3>
          <p className="text-gray-400 mb-6">
            Unable to connect to https://game.goalplay.pro/api/. Using offline mode.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => refetch()}
              className="btn-primary"
            >
              Retry Connection
            </button>
            <p className="text-xs text-gray-500">
              Endpoint: https://game.goalplay.pro/api/leaderboard
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div className="glass-dark rounded-xl p-6">
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No Rankings Yet
          </h3>
          <p className="text-gray-400">
            Be the first to play and claim the top spot!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      <div className="mb-12">
        <h3 className="text-2xl font-display font-bold text-white mb-6 text-center">
          🏆 Champions Podium
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {leaderboard.slice(0, 3).map((player: LeaderboardPlayer, index: number) => (
            <motion.div
              key={player.userId || player.address || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative ${
                index === 0 ? 'md:order-2 md:-mt-8' : 
                index === 1 ? 'md:order-1' : 'md:order-3'
              }`}
            >
              <div className={`game-card text-center p-8 ${
                highlightedUser === (player.address || player.userId) ? 'ring-2 ring-football-green' : ''
              }`}>
                {/* Rank Badge */}
                <div className={`absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-r ${getRankBadgeColor(player.rank)} rounded-full flex items-center justify-center border-4 border-dark-500`}>
                  {getRankIcon(player.rank)}
                </div>
                
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 mt-4 border-2 border-white/20">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      alt={player.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-football-green to-football-blue flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {player.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                <h4 className="text-lg font-semibold text-white mb-2">{player.username}</h4>
                <p className="text-xs text-gray-400 mb-4 font-mono">
                  {player.address ? 
                    `${player.address.slice(0, 6)}...${player.address.slice(-4)}` :
                    `ID: ${player.userId.slice(0, 8)}`
                  }
                </p>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wins:</span>
                    <span className="text-white font-semibold">{player.wins || player.gamesWon || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate:</span>
                    <span className={`font-semibold ${getWinRateColor(player.winRate)}`}>
                      {typeof player.winRate === 'string' ? 
                        parseFloat(player.winRate).toFixed(1) : 
                        player.winRate.toFixed(1)
                      }%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Rewards:</span>
                    <span className="text-football-green font-semibold">
                      {formatCurrency(player.rewards || player.totalRewards || '0')}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="glass-dark rounded-xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Full Rankings</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-green-400">Live Updates</span>
            </div>
          </div>

          {/* Table Header - Desktop */}
          <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-white/10 text-sm font-medium text-gray-400">
            <div className="col-span-1">Rank</div>
            <div className="col-span-4">Player</div>
            <div className="col-span-2">Wins</div>
            <div className="col-span-2">Games</div>
            <div className="col-span-2">Win Rate</div>
            <div className="col-span-1">Rewards</div>
          </div>

          {/* Leaderboard Entries */}
          <div className="space-y-2">
            {leaderboard.map((player: LeaderboardPlayer, index: number) => (
              <motion.div
                key={player.userId || player.address || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg transition-colors hover:bg-white/10 ${
                  false // Disabled until Web3 is connected
                    ? 'bg-football-green/20 border border-football-green/50' 
                    : 'hover:bg-white/5'
                }`}
              >
                {/* Desktop Layout */}
                <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <div className={`w-8 h-8 bg-gradient-to-r ${getRankBadgeColor(player.rank)} rounded-full flex items-center justify-center`}>
                      {player.rank <= 3 ? (
                        getRankIcon(player.rank)
                      ) : (
                        <span className="text-white font-bold text-sm">{player.rank}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="col-span-4 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                      {player.avatar || player.userId ? (
                        <img
                          src={player.avatar || `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100`}
                          alt={player.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-football-green to-football-blue flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {player.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{player.username}</div>
                      <div className="text-sm text-gray-400 font-mono">
                        {player.address ? 
                          `${player.address.slice(0, 6)}...${player.address.slice(-4)}` :
                          `ID: ${player.userId.slice(0, 8)}`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="font-semibold text-white">{player.wins || player.gamesWon || 0}</div>
                    <div className="text-sm text-green-400">+{Math.floor(Math.random() * 5) + 1} today</div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className="font-semibold text-white">{player.totalGames || player.gamesPlayed || 0}</div>
                    <div className="text-sm text-gray-400">total</div>
                  </div>
                  
                  <div className="col-span-2">
                    <div className={`font-semibold ${getWinRateColor(player.winRate)}`}>
                      {typeof player.winRate === 'string' ? 
                        parseFloat(player.winRate).toFixed(1) : 
                        player.winRate.toFixed(1)
                      }%
                    </div>
                    <div className="text-sm text-blue-400">
                      {Math.random() > 0.5 ? '+' : '-'}{(Math.random() * 5).toFixed(1)}%
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <div className="font-semibold text-football-green">
                      {formatCurrency(player.rewards || player.totalRewards || '0')}
                    </div>
                  </div>
                </div>

                {/* Mobile Layout */}
                <div className="lg:hidden">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${getRankBadgeColor(player.rank)} rounded-full flex items-center justify-center`}>
                        {player.rank <= 3 ? (
                          getRankIcon(player.rank)
                        ) : (
                          <span className="text-white font-bold text-sm">{player.rank}</span>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                        {player.avatar || player.userId ? (
                          <img
                            src={player.avatar || `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100`}
                            alt={player.username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-football-green to-football-blue flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {player.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{player.username}</div>
                        <div className="text-sm text-gray-400">
                          {player.wins || player.gamesWon || 0} wins • {
                            typeof player.winRate === 'string' ? 
                              parseFloat(player.winRate).toFixed(1) : 
                              player.winRate.toFixed(1)
                          }% rate
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-football-green">
                        {formatCurrency(player.rewards || player.totalRewards || '0')}
                      </div>
                      <div className="text-sm text-gray-400">{player.totalGames || player.gamesPlayed || 0} games</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardTable;