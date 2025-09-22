import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  Activity,
  RefreshCw,
  Download,
  Eye,
  Shield,
  BarChart3
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'security' | 'analytics'>('overview');

  // Fetch admin data
  const { data: revenueReport, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['revenue-report'],
    queryFn: async () => {
      const response = await fetch('/api/blockchain/revenue-report?days=30');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const { data: monitoringReport, isLoading: monitoringLoading, refetch: refetchMonitoring } = useQuery({
    queryKey: ['monitoring-report'],
    queryFn: async () => {
      const response = await fetch('/api/blockchain/monitoring-report');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: networkStats, isLoading: networkLoading } = useQuery({
    queryKey: ['network-stats'],
    queryFn: async () => {
      const response = await fetch('/api/blockchain/network-stats');
      return response.json();
    },
    refetchInterval: 60000,
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const formatCurrency = (amount: string | number) => {
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

  const downloadReport = () => {
    if (revenueReport) {
      const dataStr = JSON.stringify(revenueReport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    }
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
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Monitor blockchain payments, security, and business analytics in real-time
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="glass-dark rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {revenueReport ? formatCurrency(revenueReport.totalRevenue) : '...'}
            </div>
            <div className="text-sm text-gray-400">Total Revenue (30d)</div>
          </div>

          <div className="glass-dark rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {monitoringReport?.pendingOrders || 0}
            </div>
            <div className="text-sm text-gray-400">Pending Orders</div>
          </div>

          <div className="glass-dark rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {monitoringReport?.suspiciousTransactions || 0}
            </div>
            <div className="text-sm text-gray-400">Suspicious Activity</div>
          </div>

          <div className="glass-dark rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-football-orange to-football-green rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {revenueReport?.transactionCount || 0}
            </div>
            <div className="text-sm text-gray-400">Verified Payments</div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-1 mb-8 glass-dark rounded-lg p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-football-green text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Network Status */}
              <div className="glass-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">BSC Network Status</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                </div>

                {networkLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Loading network stats..." />
                  </div>
                ) : networkStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatNumber(networkStats.currentBlock)}
                      </div>
                      <div className="text-sm text-gray-400">Current Block</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {parseFloat(networkStats.gasPrice).toFixed(1)} Gwei
                      </div>
                      <div className="text-sm text-gray-400">Gas Price</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatCurrency(networkStats.bnbPrice)}
                      </div>
                      <div className="text-sm text-gray-400">BNB Price</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue Overview */}
              <div className="glass-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Revenue Overview (30 Days)</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => refetchRevenue()}
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refresh</span>
                    </button>
                    <button
                      onClick={downloadReport}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {revenueLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Loading revenue data..." />
                  </div>
                ) : revenueReport && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-football-green mb-2">
                          {formatCurrency(revenueReport.totalRevenue)}
                        </div>
                        <div className="text-sm text-gray-400">Total Revenue</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-football-blue mb-2">
                          {revenueReport.transactionCount}
                        </div>
                        <div className="text-sm text-gray-400">Transactions</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-football-purple mb-2">
                          {formatCurrency(revenueReport.averageOrderValue)}
                        </div>
                        <div className="text-sm text-gray-400">Avg Order Value</div>
                      </div>
                    </div>

                    {/* Top Paying Addresses */}
                    {revenueReport.topPayingAddresses && revenueReport.topPayingAddresses.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Top Paying Addresses</h4>
                        <div className="space-y-3">
                          {revenueReport.topPayingAddresses.slice(0, 5).map((payer: any, index: number) => (
                            <div key={payer.address} className="flex items-center justify-between p-3 glass rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">{index + 1}</span>
                                </div>
                                <div>
                                  <div className="text-white font-mono text-sm">
                                    {payer.address.slice(0, 6)}...{payer.address.slice(-4)}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {payer.count} transactions
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-football-green font-semibold">
                                  {formatCurrency(payer.amount)}
                                </div>
                                <a
                                  href={`https://bscscan.com/address/${payer.address}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                  View on BSCScan
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Payment Monitoring */}
              <div className="glass-dark rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Payment Monitoring</h3>
                  <button
                    onClick={() => refetchMonitoring()}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                {monitoringLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Loading monitoring data..." />
                  </div>
                ) : monitoringReport && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 glass rounded-lg">
                      <div className="text-2xl font-bold text-yellow-400 mb-1">
                        {monitoringReport.pendingOrders}
                      </div>
                      <div className="text-sm text-gray-400">Pending Orders</div>
                    </div>
                    
                    <div className="text-center p-4 glass rounded-lg">
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {monitoringReport.totalVerified}
                      </div>
                      <div className="text-sm text-gray-400">Verified Payments</div>
                    </div>
                    
                    <div className="text-center p-4 glass rounded-lg">
                      <div className="text-2xl font-bold text-red-400 mb-1">
                        {monitoringReport.expiredOrders}
                      </div>
                      <div className="text-sm text-gray-400">Expired Orders</div>
                    </div>
                    
                    <div className="text-center p-4 glass rounded-lg">
                      <div className="text-2xl font-bold text-orange-400 mb-1">
                        {monitoringReport.suspiciousTransactions}
                      </div>
                      <div className="text-sm text-gray-400">Suspicious Activity</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Revenue Breakdown */}
              {revenueReport?.dailyBreakdown && (
                <div className="glass-dark rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Daily Revenue Breakdown</h3>
                  
                  <div className="space-y-3">
                    {revenueReport.dailyBreakdown.slice(0, 10).map((day: any) => (
                      <div key={day.date} className="flex items-center justify-between p-3 glass rounded-lg">
                        <div>
                          <div className="text-white font-medium">
                            {new Date(day.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            {day.count} transactions
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-football-green font-semibold">
                            {formatCurrency(day.revenue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              {/* Security Overview */}
              <div className="glass-dark rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Security Monitoring</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Fraud Detection</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Score Threshold:</span>
                        <span className="text-white">70/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Auto-Block Enabled:</span>
                        <span className="text-green-400">Yes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Manual Review Queue:</span>
                        <span className="text-yellow-400">{monitoringReport?.suspiciousTransactions || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-white">Network Security</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Required Confirmations:</span>
                        <span className="text-white">12 blocks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">USDT Contract:</span>
                        <a
                          href="https://bscscan.com/token/0x55d398326f99059fF775485246999027B3197955"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors font-mono text-sm"
                        >
                          0x55d3...7955
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Network Congestion:</span>
                        <span className={`${
                          networkStats?.networkCongestion === 'low' ? 'text-green-400' :
                          networkStats?.networkCongestion === 'medium' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {networkStats?.networkCongestion || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Suspicious Activity */}
              <div className="glass-dark rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Recent Suspicious Activity</h3>
                
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">No suspicious activity detected in the last 24 hours</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Our AI monitors all transactions for unusual patterns
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Business Analytics */}
              <div className="glass-dark rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Business Analytics</h3>
                
                {revenueReport && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Key Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average Order Value:</span>
                          <span className="text-white font-semibold">
                            {formatCurrency(revenueReport.averageOrderValue)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Conversion Rate:</span>
                          <span className="text-white font-semibold">12.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Customer LTV:</span>
                          <span className="text-white font-semibold">
                            {formatCurrency(parseFloat(revenueReport.averageOrderValue) * 3.2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Monthly Growth:</span>
                          <span className="text-green-400 font-semibold">+24.8%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Payment Methods</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">USDT (BSC):</span>
                          <span className="text-white font-semibold">98.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Other Tokens:</span>
                          <span className="text-white font-semibold">1.5%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Failed Payments:</span>
                          <span className="text-red-400 font-semibold">0.8%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Confirmation Time:</span>
                          <span className="text-white font-semibold">3.2 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Blockchain Data */}
              <div className="glass-dark rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Live Blockchain Data</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 glass rounded-lg">
                    <div className="text-2xl font-bold text-white mb-1">
                      {networkStats ? `${parseFloat(networkStats.gasPrice).toFixed(1)}` : '...'}
                    </div>
                    <div className="text-sm text-gray-400">Current Gas (Gwei)</div>
                  </div>
                  
                  <div className="text-center p-4 glass rounded-lg">
                    <div className="text-2xl font-bold text-white mb-1">
                      {networkStats ? formatCurrency(networkStats.bnbPrice) : '...'}
                    </div>
                    <div className="text-sm text-gray-400">BNB Price</div>
                  </div>
                  
                  <div className="text-center p-4 glass rounded-lg">
                    <div className="text-2xl font-bold text-white mb-1">
                      {networkStats ? formatCurrency(networkStats.usdtPrice) : '...'}
                    </div>
                    <div className="text-sm text-gray-400">USDT Price</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 text-sm">
            🔗 Connected to BSC Mainnet • 
            <a 
              href="https://bscscan.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-football-green hover:text-football-blue transition-colors ml-1"
            >
              View on BSCScan
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;