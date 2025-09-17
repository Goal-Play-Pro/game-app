import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Users, Target, Star, Medal, Crown } from 'lucide-react';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable';
import LiveStatistics from '../components/stats/LiveStatistics';
import LoadingSpinner from '../components/common/LoadingSpinner';

const LeaderboardPage = () => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('weekly');
  const [category, setCategory] = useState<'overall' | 'wins' | 'winrate' | 'earnings'>('overall');

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
          <LiveStatistics showUserStats={false} />
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