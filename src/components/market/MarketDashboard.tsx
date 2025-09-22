import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Activity,
  BarChart3,
  PieChart,
  Clock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const MarketDashboard = () => {
  // Fetch comprehensive market data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-data'],
    queryFn: ApiService.getMarketData,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
    retryDelay: 1000,
  });

  const { data: globalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['global-statistics'],
    queryFn: ApiService.getGlobalStatistics,
    refetchInterval: 60000, // Refresh every minute
    retry: 1,
    retryDelay: 1000,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ['system-health'],
    queryFn: ApiService.getSystemHealth,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1,
    retryDelay: 1000,
  });

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(num);
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

  if (marketLoading || statsLoading) {
    return (
      <div className="glass-dark rounded-xl p-6">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" text="Loading market data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {marketData?.products?.length || 0}
          </div>
          <div className="text-sm text-gray-400">Products Available</div>
        </div>

        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatCurrency(marketData?.totalVolume || 0)}
          </div>
          <div className="text-sm text-gray-400">Total Volume</div>
        </div>

        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatNumber(globalStats?.totalUsers || 0)}
          </div>
          <div className="text-sm text-gray-400">Total Users</div>
        </div>

        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-orange to-football-green rounded-full flex items-center justify-center mx-auto mb-3">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatNumber(globalStats?.activeUsers || 0)}
          </div>
          <div className="text-sm text-gray-400">Active Users</div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="glass-dark rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Recent Market Activity</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-green-400">Live</span>
          </div>
        </div>

        {marketData?.recentOrders && marketData.recentOrders.length > 0 ? (
          <div className="space-y-3">
            {marketData.recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between p-3 glass rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      Order #{order.id.slice(0, 8)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-football-green font-semibold">
                    {formatCurrency(order.totalPriceUSDT)}
                  </div>
                  <div className={`text-xs ${
                    order.status === 'fulfilled' ? 'text-green-400' :
                    order.status === 'paid' ? 'text-blue-400' :
                    order.status === 'pending' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {order.status.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No recent market activity</p>
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">System Health</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className={`font-semibold ${
                systemHealth?.status === 'healthy' ? 'text-green-400' : 'text-red-400'
              }`}>
                {systemHealth?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime:</span>
              <span className="text-white font-semibold">
                {systemHealth?.uptime ? `${Math.floor(systemHealth.uptime / 3600)}h` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Memory:</span>
              <span className="text-white font-semibold">
                {systemHealth?.memory?.rss || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-football-blue/20 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-football-blue" />
            </div>
            <h4 className="text-lg font-semibold text-white">Platform Stats</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Games:</span>
              <span className="text-white font-semibold">
                {formatNumber(globalStats?.totalGames || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Rewards:</span>
              <span className="text-white font-semibold">
                {formatCurrency(globalStats?.totalRewards || '0')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Success Rate:</span>
              <span className="text-white font-semibold">
                {globalStats?.successRate || 'N/A'}%
              </span>
            </div>
          </div>
        </div>

        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-football-purple/20 rounded-full flex items-center justify-center">
              <PieChart className="w-5 h-5 text-football-purple" />
            </div>
            <h4 className="text-lg font-semibold text-white">Market Trends</h4>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Most Popular:</span>
              <span className="text-white font-semibold">Primera Packs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Order:</span>
              <span className="text-white font-semibold">
                {formatCurrency(marketData?.totalVolume ? marketData.totalVolume / (marketData.recentOrders?.length || 1) : 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Growth:</span>
              <span className="text-green-400 font-semibold">+12.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDashboard;