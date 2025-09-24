import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Target, Star, Medal, Crown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import LiveStatistics from '../components/stats/LiveStatistics';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuthStatus } from '../hooks/useAuthStatus';

const LeaderboardPage = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [category, setCategory] = useState<'overall' | 'wins' | 'winrate' | 'earnings'>('overall');
  const isAuthenticated = useAuthStatus();

  // Fetch real leaderboard data from API
  const { data: leaderboardData, isLoading: leaderboardLoading, error: leaderboardError } = useQuery({
    queryKey: ['leaderboard-data', timeframe, category],
    queryFn: async () => {
      console.log('🏆 Fetching leaderboard from production API...');
      try {
        const result = await ApiService.getLeaderboard();
        console.log('✅ Leaderboard loaded from production API:', result?.length || 0, 'players');
        return result;
      } catch (error) {
        console.warn('⚠️ Production API leaderboard failed, using fallback data:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch global statistics from API
  const { data: globalStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['global-statistics'],
    queryFn: async () => {
      console.log('📊 Fetching global stats from production API...');
      try {
        const result = await ApiService.getGlobalStatistics();
        console.log('✅ Global stats loaded from production API:', result);
        return result;
      } catch (error) {
        console.warn('⚠️ Production API global stats failed:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch system health for live status
  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      console.log('🏥 Fetching system health from production API...');
      try {
        const result = await ApiService.getSystemHealth();
        console.log('✅ System health loaded from production API:', result);
        return result;
      } catch (error) {
        console.warn('⚠️ Production API system health failed:', error);
        return null;
      }
    },
    retry: 1,
    refetchInterval: 30000,
  });

  const timeframes = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'all', label: 'All Time' }
  ];

  const categories = [
    { value: 'overall', label: 'Overall', icon: Trophy },
    { value: 'wins', label: 'Most Wins', icon: Target },
    { value: 'winrate', label: 'Win Rate', icon: TrendingUp },
    { value: 'earnings', label: 'Top Earners', icon: Star }
  ];

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

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
            Leaderboard
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Compete with players worldwide and climb to the top of the rankings
          </p>
        </motion.div>

        {/* Live Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Global Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-dark rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {statsLoading ? '...' : formatNumber(globalStats?.totalUsers || 0)}
              </div>
              <div className="text-sm text-gray-400">Total Players</div>
              {statsError && <div className="text-xs text-red-400 mt-1">API Error</div>}
            </div>
            
            <div className="glass-dark rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {statsLoading ? '...' : formatNumber(globalStats?.totalGames || 0)}
              </div>
              <div className="text-sm text-gray-400">Games Played</div>
            </div>
            
            <div className="glass-dark rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {statsLoading ? '...' : `$${globalStats?.totalRewards || '0'}`}
              </div>
              <div className="text-sm text-gray-400">Total Rewards</div>
            </div>
            
            <div className="glass-dark rounded-xl p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-orange to-football-green rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {statsLoading ? '...' : formatNumber(globalStats?.activeUsers || 0)}
              </div>
              <div className="text-sm text-gray-400">Active Users</div>
            </div>
          </div>
          
          {/* System Status */}
          {systemHealth && (
            <div className="glass-dark rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white font-semibold">System Status: {systemHealth.status}</span>
                </div>
                <div className="text-sm text-gray-400">
                  Uptime: {Math.floor((systemHealth.uptime || 0) / 3600)}h • 
                  Memory: {systemHealth.memory?.rss || 'N/A'} • 
                  Environment: {systemHealth.environment || 'unknown'}
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col lg:flex-row gap-6 mb-8"
        >
          {/* Timeframe Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm font-medium">Period:</span>
            <div className="flex items-center glass-dark rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeframe === tf.value
                      ? 'bg-football-green text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm font-medium">Category:</span>
            <div className="flex items-center glass-dark rounded-lg p-1">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    category === cat.value
                      ? 'bg-football-green text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <cat.icon className="w-4 h-4" />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <LeaderboardTable
            timeframe={timeframe}
            category={category}
            limit={100}
            showUserHighlight={false}
          />
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass-dark rounded-xl p-8 text-center"
        >
          <h3 className="text-2xl font-display font-bold gradient-text mb-4">
            Ready to Climb the Rankings?
          </h3>
          <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
            Start playing penalty shootouts to earn your place on the leaderboard and win amazing rewards
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/game" className="btn-primary flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Start Playing</span>
            </a>
            
            <a href="/shop" className="btn-outline flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Get Players</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LeaderboardPage;