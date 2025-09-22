import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Users,
  Settings, 
  Share2, 
  Copy, 
  ExternalLink,
  Wallet,
  Trophy,
  Target,
  Star,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReferralDashboard from '../components/referral/ReferralDashboard';
import WalletManager from '../components/wallet/WalletManager';
import { CompleteUserProfile } from '../services/api';
import { useAuthStatus } from '../hooks/useAuthStatus';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'referrals' | 'wallets' | 'history' | 'settings'>('overview');
  const isAuthenticated = useAuthStatus();

  // Mock user data - in real app this would come from auth context
  const currentUser = {
    id: '1',
    username: 'golplayer',
    displayName: 'Gol Player',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
    banner: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=1200',
    bio: 'Passionate football gamer and NFT collector. Master of penalty shootouts.',
    walletAddress: '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
    isVerified: true,
    joinedAt: '2024-01-15',
    level: 25,
    experience: 15420,
    nextLevelXP: 20000,
  };

  // Fetch comprehensive user data
  const { data: completeProfile, isLoading: profileLoading } = useQuery<CompleteUserProfile>({
    queryKey: ['complete-user-profile'],
    queryFn: () => ApiService.getCompleteUserProfile(),
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 30000 : false,
  });

  const { data: ownedPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['owned-players'],
    queryFn: ApiService.getOwnedPlayers,
    enabled: isAuthenticated,
  });

  const { data: userSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['user-sessions'],
    queryFn: ApiService.getUserSessions,
    enabled: isAuthenticated,
  });

  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: ApiService.getUserOrders,
    enabled: isAuthenticated,
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['user-transactions'],
    queryFn: () => ApiService.getTransactions(),
    enabled: isAuthenticated,
  });

  // Fetch all user wallets
  const { data: userWallets, isLoading: walletsLoading } = useQuery({
    queryKey: ['user-wallets'],
    queryFn: ApiService.getAllUserWallets,
    enabled: isAuthenticated,
  });
  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'referrals', label: 'Referrals', icon: Users },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(currentUser.walletAddress);
    // You could add a toast notification here
  };

  const shareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${currentUser.displayName} - Gol Play Profile`,
        text: currentUser.bio,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  // Calculate stats
  const totalPlayers = ownedPlayers?.length || 0;
  const totalGames = userSessions?.length || 0;
  const completedGames = userSessions?.filter(s => s.status === 'completed').length || 0;
  const winRate = completedGames > 0 ? ((completedGames * 0.7) * 100).toFixed(1) : '0'; // Mock win rate
  const totalSpent = completeProfile?.totalSpent || userOrders?.reduce((sum, order) => sum + parseFloat(order.totalPriceUSDT), 0) || 0;

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <div className="glass-dark rounded-xl p-10 text-center space-y-4 max-w-md">
          <Users className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-2xl font-display text-white">Connect your wallet</h2>
          <p className="text-gray-400">
            Sign in with your wallet to view your profile, orders, and referral statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-20">
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={currentUser.banner}
          alt="Profile Banner"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative -mt-20 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.displayName}
                className="w-32 h-32 rounded-full border-4 border-white/20 glass"
              />
              {currentUser.isVerified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-football-green rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
              {/* Level Badge */}
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center border-2 border-white/20">
                <span className="text-white font-bold text-sm">{currentUser.level}</span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                    {currentUser.displayName}
                  </h1>
                  <p className="text-gray-400 mb-4">@{currentUser.username}</p>
                  
                  {/* Wallet Address */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Wallet className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-400">
                      {currentUser.walletAddress.slice(0, 6)}...{currentUser.walletAddress.slice(-4)}
                    </span>
                    <button
                      onClick={copyAddress}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-400 hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Connected Wallets Count */}
                  {userWallets && userWallets.length > 1 && (
                    <div className="mb-4">
                      <span className="text-sm text-gray-400">
                        ${completeProfile?.referralStats?.totalCommissions || '0.00'}
                      </span>
                    </div>
                  )}
                  {/* XP Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Level {currentUser.level}</span>
                      <span>{currentUser.experience}/{currentUser.nextLevelXP} XP</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-football-green to-football-blue h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(currentUser.experience / currentUser.nextLevelXP) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={shareProfile}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  <button className="btn-primary flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bio */}
          {currentUser.bio && (
            <p className="text-gray-300 mt-4 max-w-2xl">
              {currentUser.bio}
            </p>
          )}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {totalPlayers}
            </div>
            <div className="text-sm text-gray-400">Players Owned</div>
          </div>
          
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {totalGames}
            </div>
            <div className="text-sm text-gray-400">Games Played</div>
          </div>
          
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {winRate}%
            </div>
            <div className="text-sm text-gray-400">Win Rate</div>
          </div>
          
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              ${totalSpent.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400">Total Spent</div>
          </div>
          
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              #127
            </div>
            <div className="text-sm text-gray-400">Global Rank</div>
          </div>
          
          {/* Additional Stats from Complete Profile */}
          {completeProfile && (
            <>
              <div className="glass-dark rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {completeProfile.wallets?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Wallets</div>
              </div>
              
              <div className="glass-dark rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {completeProfile?.transactions?.length || 0}
                </div>
                <div className="text-sm text-gray-400">Transactions</div>
              </div>
            </>
          )}
        </motion.div>

        {/* Tabs and Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Tab Navigation */}
          <div className="flex items-center space-x-1 mb-8 glass-dark rounded-lg p-1">
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
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <div className="glass-dark rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
                  
                  {sessionsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Loading activity..." />
                    </div>
                  ) : userSessions && userSessions.length > 0 ? (
                    <div className="space-y-4">
                      {userSessions.slice(0, 5).map((session) => (
                        <div key={session.id} className="flex items-center space-x-4 p-3 glass rounded-lg">
                          <div className="w-10 h-10 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-medium">
                              Penalty Session
                            </div>
                            <div className="text-sm text-gray-400">
                              {session.type === 'single_player' ? 'vs AI' : 'vs Player'} • 
                              Score: {session.hostScore}-{session.guestScore}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-sm font-semibold ${
                              session.status === 'completed' ? 'text-green-400' :
                              session.status === 'in_progress' ? 'text-blue-400' :
                              'text-yellow-400'
                            }`}>
                              {session.status.replace('_', ' ').toUpperCase()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400">No recent activity</p>
                    </div>
                  )}
                </div>

                {/* Achievements */}
                <div className="glass-dark rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Achievements</h3>
                  
                  <div className="space-y-4">
                    {[
                      { icon: Trophy, title: 'First Victory', description: 'Win your first penalty shootout', completed: true },
                      { icon: Target, title: 'Sharpshooter', description: 'Score 10 consecutive penalties', completed: true },
                      { icon: Star, title: 'Rising Star', description: 'Reach level 25', completed: true },
                      { icon: User, title: 'Collector', description: 'Own 10 different players', completed: false },
                    ].map((achievement, index) => (
                      <div key={index} className={`flex items-center space-x-4 p-3 glass rounded-lg ${
                        achievement.completed ? 'bg-football-green/10' : 'opacity-60'
                      }`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          achievement.completed 
                            ? 'bg-gradient-to-r from-football-green to-football-blue' 
                            : 'bg-gray-600'
                        }`}>
                          <achievement.icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{achievement.title}</div>
                          <div className="text-sm text-gray-400">{achievement.description}</div>
                        </div>
                        {achievement.completed && (
                          <div className="text-football-green">
                            <span className="text-lg">✓</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Game Stats */}
                <div className="glass-dark rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Game Performance</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Games:</span>
                      <span className="text-white font-semibold">{totalGames}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="text-white font-semibold">{winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Best Streak:</span>
                      <span className="text-white font-semibold">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Goals Scored:</span>
                      <span className="text-white font-semibold">156</span>
                    </div>
                  </div>
                </div>

                {/* Collection Stats */}
                <div className="glass-dark rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Collection</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Players:</span>
                      <span className="text-white font-semibold">{totalPlayers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Level:</span>
                      <span className="text-white font-semibold">
                        {ownedPlayers?.length ? 
                          Math.round(ownedPlayers.reduce((sum, p) => sum + p.currentLevel, 0) / ownedPlayers.length) : 0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Highest Level:</span>
                      <span className="text-white font-semibold">
                        {ownedPlayers?.length ? Math.max(...ownedPlayers.map(p => p.currentLevel)) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total XP:</span>
                      <span className="text-white font-semibold">
                        {formatNumber(ownedPlayers?.reduce((sum, p) => sum + p.experience, 0) || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Stats */}
                <div className="glass-dark rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Financial</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Spent:</span>
                      <span className="text-white font-semibold">
                        ${((completeProfile?.totalSpent || totalSpent) || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Earned:</span>
                      <span className="text-white font-semibold">$1,250.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Net Profit:</span>
                      <span className="text-green-400 font-semibold">
                        +${(1250 - ((completeProfile?.totalSpent || totalSpent) || 0)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Best Day:</span>
                      <span className="text-white font-semibold">$85.00</span>
                    </div>
                    {completeProfile?.referralStats?.totalCommissions && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Referral Earnings:</span>
                        <span className="text-football-green font-semibold">
                          ${completeProfile.referralStats.totalCommissions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <ReferralDashboard />
            )}

            {activeTab === 'wallets' && (
              <WalletManager />
            )}
            {activeTab === 'history' && (
              <div className="space-y-6">
                {/* Transaction History */}
                <div className="glass-dark rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Transaction History</h3>
                  
                  {transactionsLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Loading transactions..." />
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    <div className="space-y-4">
                      {transactions.slice(0, 10).map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 glass rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'credit' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}
                            </div>
                            <div>
                              <div className="text-white font-medium">{transaction.description}</div>
                              <div className="text-sm text-gray-400">
                                {new Date(transaction.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}${transaction.amount} {transaction.currency}
                            </div>
                            <div className="text-sm text-gray-400">
                              Balance: ${transaction.balanceAfter}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No transaction history available</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="glass-dark rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Profile Settings</h3>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Display Name</label>
                    <input
                      type="text"
                      defaultValue={currentUser.displayName}
                      className="w-full input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Bio</label>
                    <textarea
                      rows={4}
                      defaultValue={currentUser.bio}
                      className="w-full input-field resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Notifications</label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-gray-300">Game results</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="text-gray-300">New player packs</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" className="rounded" />
                        <span className="text-gray-300">Tournament invitations</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/10">
                    <button className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;
