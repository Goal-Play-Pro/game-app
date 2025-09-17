import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Trophy, Activity } from 'lucide-react';

interface LiveStats {
  totalPlayers: number;
  activeGames: number;
  totalRewards: number;
  topPlayer: string;
}

interface LiveStatisticsProps {
  showUserStats?: boolean;
}

const LiveStatistics: React.FC<LiveStatisticsProps> = ({ showUserStats = true }) => {
  const [stats, setStats] = useState<LiveStats>({
    totalPlayers: 0,
    activeGames: 0,
    totalRewards: 0,
    topPlayer: 'Loading...'
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading live statistics
    const loadStats = async () => {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - replace with real API call
      setStats({
        totalPlayers: Math.floor(Math.random() * 10000) + 5000,
        activeGames: Math.floor(Math.random() * 100) + 50,
        totalRewards: Math.floor(Math.random() * 1000000) + 500000,
        topPlayer: 'Player#' + Math.floor(Math.random() * 9999).toString().padStart(4, '0')
      });
      
      setIsLoading(false);
    };

    loadStats();
    
    // Update stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    trend?: string;
  }> = ({ icon, title, value, trend }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '...' : value}
            </p>
          </div>
        </div>
        {trend && (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">
            {trend}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Live Statistics
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Activity className="w-4 h-4" />
          <span>Updates every 30s</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-blue-600" />}
          title="Total Players"
          value={stats.totalPlayers.toLocaleString()}
          trend="+12%"
        />
        
        <StatCard
          icon={<Activity className="w-6 h-6 text-green-600" />}
          title="Active Games"
          value={stats.activeGames}
          trend="+5%"
        />
        
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
          title="Total Rewards"
          value={`$${(stats.totalRewards / 1000).toFixed(0)}K`}
          trend="+8%"
        />
        
        <StatCard
          icon={<Trophy className="w-6 h-6 text-yellow-600" />}
          title="Top Player"
          value={stats.topPlayer}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">
            Loading live data...
          </span>
        </div>
      )}
    </div>
  );
};

export default LiveStatistics;