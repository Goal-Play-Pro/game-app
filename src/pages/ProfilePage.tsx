import { useState, useEffect } from 'react';
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
  Calendar,
  Gift,
  Link as LinkIcon
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import { API_CONFIG } from '../config/api.config';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReferralDashboard from '../components/referral/ReferralDashboard';
import WalletManager from '../components/wallet/WalletManager';
import EditProfileModal from '../components/profile/EditProfileModal';
import { CompleteUserProfile } from '../services/api';
import { useAuthStatus } from '../hooks/useAuthStatus';

import { shareContent, showCopyNotification } from '../utils/share.utils';
import { logWalletRequirement } from '../utils/wallet.utils';
import { getStoredWallet } from '../utils/walletStorage';

const ProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'referrals' | 'wallets' | 'history' | 'settings'>(() => {
    // Check URL params for tab
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return (tabParam as any) || 'overview';
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isAuthenticated = useAuthStatus();
  const queryClient = useQueryClient();

  // Get real user wallet address
  const storedWallet = getStoredWallet();
  const connectedWalletAddress = storedWallet.address;
  const connectedWalletCaip10 = storedWallet.caip10;
  const isWalletConnected = storedWallet.isConnected;

  useEffect(() => {
    if (!isWalletConnected || !connectedWalletAddress) {
      logWalletRequirement('Profile page');
    }
  }, [isWalletConnected, connectedWalletAddress]);

  // Mock user data - in real app this would come from auth context
  const [currentUser, setCurrentUser] = useState({
    id: '1',
    username: 'golplayer',
    displayName: 'Goal Player',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300',
    banner: 'https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=1200',
    bio: 'Passionate football gamer and NFT collector. Master of penalty shootouts.',
    walletAddress: connectedWalletAddress || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
    walletAddressCaip10: connectedWalletCaip10,
    isVerified: true,
    joinedAt: '2024-01-15',
    level: 25,
    experience: 15420,
    nextLevelXP: 20000,
  });

  // State for profile updates
  const [profileData, setProfileData] = useState({
    displayName: currentUser.displayName,
    bio: currentUser.bio,
    avatar: currentUser.avatar,
  });

  // Fetch comprehensive user data
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => {
      console.log('👤 Loading user profile from production API...');
      return ApiService.getUserProfile();
    },
    enabled: isWalletConnected && !!connectedWalletAddress,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch referral code
  const { data: referralCode, isLoading: referralCodeLoading } = useQuery({
    queryKey: ['my-referral-code'],
    queryFn: () => ApiService.getMyReferralCode(),
    enabled: isAuthenticated,
    retry: false,
  });

  // Fetch referral stats
  const { data: referralStats, isLoading: referralStatsLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => ApiService.getReferralStats(),
    enabled: isAuthenticated,
    retry: false,
  });

  // Update profile data when user profile loads
  useEffect(() => {
    if (userProfile) {
      console.log('📝 Updating profile data from production API:', userProfile);
      setProfileData({
        displayName: userProfile.displayName || currentUser.displayName,
        bio: userProfile.bio || currentUser.bio,
        avatar: userProfile.avatar || currentUser.avatar,
      });
      
      // Update current user with real data
      setCurrentUser(prev => ({
        ...prev,
        displayName: userProfile.displayName || prev.displayName,
        bio: userProfile.bio || prev.bio,
        avatar: userProfile.avatar || prev.avatar,
      }));
    }
  }, [userProfile]);

  const { data: completeProfile, isLoading: completeProfileLoading } = useQuery<CompleteUserProfile>({
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

  // Create referral code mutation
  const createReferralCodeMutation = useMutation({
    mutationFn: async (customCode?: string) => {
      console.log('🚀 Creating referral code via production API for wallet:', connectedWalletAddress);
      
      if (!connectedWalletAddress) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }
      
      // Generate code based on wallet address
      const walletBasedCode = customCode || (connectedWalletAddress.slice(2, 8).toUpperCase() + 
        Math.random().toString(36).substring(2, 5).toUpperCase());
      
      return await ApiService.createReferralCode(walletBasedCode);
    },
    onSuccess: (data) => {
      console.log('✅ Referral code created successfully via production API:', data);
      queryClient.invalidateQueries({ queryKey: ['my-referral-code'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      const referralBaseUrl = API_CONFIG.FRONTEND_URL;
      alert(`✅ ¡Código creado exitosamente!\n\nWallet: ${connectedWalletAddress?.slice(0, 6)}...${connectedWalletAddress?.slice(-4)}\nTu código: ${data.code}\nTu link: ${referralBaseUrl}?ref=${data.code}\n\n¡Compártelo y gana 5% de cada compra!`);
    },
    onError: (error) => {
      console.error('❌ Error creating referral code via production API:', error);
      alert(`❌ Error creando código de referido: ${error.message}\n\nAsegúrate de que tu wallet esté conectada.`);
    },
  });

  const handleCreateReferralCode = () => {
    console.log('🎯 User clicked create referral code button for wallet:', connectedWalletAddress);
    
    if (!isWalletConnected || !connectedWalletAddress) {
      alert('❌ Por favor conecta tu wallet primero para crear tu código de referido.');
      return;
    }
    
    createReferralCodeMutation.mutate();
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'referrals', label: 'Referrals (5%)', icon: Users },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const ownedPlayersList = Array.isArray(ownedPlayers) ? ownedPlayers : [];
  const userSessionsList = Array.isArray(userSessions) ? userSessions : [];
  const userOrdersList = Array.isArray(userOrders) ? userOrders : [];
  const transactionsList = Array.isArray(transactions) ? transactions : [];
  const userWalletsList = Array.isArray(userWallets) ? userWallets : [];

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
    // Usar utilidad robusta de compartir
    shareContent({
      title: `${currentUser.displayName} - Goal Play Profile`,
      text: currentUser.bio,
      url: window.location.href
    }, {
      showNotification: true,
      notificationDuration: 3000,
      fallbackToPrompt: true
    }).then((result) => {
      if (result.success) {
        console.log(`✅ Profile shared via ${result.method}`);
      } else {
        console.log('❌ Failed to share profile');
      }
    });
  };

  const copyToClipboard = () => {
    // Usar utilidad robusta de copia
    shareContent({
      title: `${currentUser.displayName} - Goal Play Profile`,
      text: currentUser.bio,
      url: window.location.href
    }, {
      showNotification: true,
      notificationDuration: 3000,
      fallbackToPrompt: true
    });
  };

  // Calculate stats
  const totalPlayers = ownedPlayersList.length;
  const totalGames = userSessionsList.length;
  const completedGames = userSessionsList.filter(s => s.status === 'completed').length;
  const winRate = completedGames > 0 ? ((completedGames * 0.7) * 100).toFixed(1) : '0'; // Mock win rate
  const totalSpentFromOrders = userOrdersList.reduce((sum, order) => {
    const amount = parseFloat(order.totalPriceUSDT ?? '0');
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const totalSpent = completeProfile && typeof completeProfile.totalSpent === 'number'
    ? completeProfile.totalSpent
    : totalSpentFromOrders;
  const normalizedTotalSpent = Number.isFinite(totalSpent) ? totalSpent : 0;

  if (!isWalletConnected || !connectedWalletAddress) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <div className="glass-dark rounded-xl p-10 text-center space-y-4 max-w-md">
          <Users className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-2xl font-display text-white">Conecta tu Wallet</h2>
          <p className="text-gray-400">
            Conecta tu wallet para ver tu perfil, órdenes y crear tu código de referido.
          </p>
          <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              🔍 Debug: Wallet conectada = {isWalletConnected ? 'true' : 'false'}
            </p>
            <p className="text-blue-400 text-xs mt-1">
              Dirección: {connectedWalletAddress || 'No conectada'}
            </p>
          </div>
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
                  {userWalletsList.length > 1 && (
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
                  
                  <button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
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
                  ) : userSessionsList.length > 0 ? (
                    <div className="space-y-4">
                      {userSessionsList.slice(0, 5).map((session) => (
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
                        {ownedPlayersList.length
                          ? Math.round(ownedPlayersList.reduce((sum, p) => sum + p.currentLevel, 0) / ownedPlayersList.length)
                          : 0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Highest Level:</span>
                      <span className="text-white font-semibold">
                        {ownedPlayersList.length ? Math.max(...ownedPlayersList.map(p => p.currentLevel)) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total XP:</span>
                      <span className="text-white font-semibold">
                        {formatNumber(ownedPlayersList.reduce((sum, p) => sum + p.experience, 0))}
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
                        ${normalizedTotalSpent.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Earned:</span>
                      <span className="text-white font-semibold">$1,250.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Net Profit:</span>
                      <span className="text-green-400 font-semibold">
                        +${(1250 - normalizedTotalSpent).toFixed(2)}
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
              <div className="space-y-6">
                {/* Referral Code Status */}
                {referralCodeLoading ? (
                  <div className="glass-dark rounded-xl p-8 text-center">
                    <LoadingSpinner size="lg" text="Loading referral data..." />
                  </div>
                ) : referralCode ? (
                  /* User already has a referral code */
                  <div className="space-y-6">
                    {/* Referral Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="glass-dark rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {referralStats?.totalReferrals || 0}
                        </div>
                        <div className="text-sm text-gray-400">Total Referrals</div>
                      </div>
                      <div className="glass-dark rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {referralStats?.activeReferrals || 0}
                        </div>
                        <div className="text-sm text-gray-400">Active</div>
                      </div>
                      <div className="glass-dark rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-football-green mb-1">
                          ${referralStats?.totalCommissions || '0.00'}
                        </div>
                        <div className="text-sm text-gray-400">Total Earned</div>
                      </div>
                      <div className="glass-dark rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-football-blue mb-1">
                          ${referralStats?.thisMonthCommissions || '0.00'}
                        </div>
                        <div className="text-sm text-gray-400">This Month</div>
                      </div>
                    </div>

                    {/* Referral Link */}
                    <div className="glass-dark rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Your Referral Link</h4>
                      
                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Your Code</div>
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 glass rounded-lg p-3">
                            <div className="text-white font-mono text-xl text-center">
                              {referralCode.code}
                            </div>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(referralCode.code)}
                            className="btn-secondary"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="text-sm text-gray-400 mb-2">Full Link</div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 glass rounded-lg p-3">
                            <div className="text-white font-mono text-sm break-all">
                              {referralStats?.referralLink || `${API_CONFIG.FRONTEND_URL}?ref=${referralCode.code}`}
                            </div>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(referralStats?.referralLink || `${API_CONFIG.FRONTEND_URL}?ref=${referralCode.code}`)}
                            className="btn-secondary"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                          onClick={() => navigator.clipboard.writeText(referralStats?.referralLink || `${API_CONFIG.FRONTEND_URL}?ref=${referralCode.code}`)}
                          className="btn-secondary flex items-center justify-center space-x-2"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                title: 'Join Goal Play!',
                                text: '🚀 Join me on Goal Play and earn rewards playing football! ⚽💰',
                                url: referralStats?.referralLink || `${API_CONFIG.FRONTEND_URL}?ref=${referralCode.code}`
                              });
                            }
                          }}
                          className="btn-secondary flex items-center justify-center space-x-2"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share</span>
                        </button>
                        <button
                          onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent('🚀 Join me on Goal Play - The ultimate football gaming platform! ⚽💰')}&url=${encodeURIComponent(referralStats?.referralLink || `${API_CONFIG.FRONTEND_URL}?ref=${referralCode.code}`)}`, '_blank')}
                          className="btn-secondary flex items-center justify-center space-x-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Tweet</span>
                        </button>
                        <button
                          onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(referralStats?.referralLink || `${API_CONFIG.FRONTEND_URL}?ref=${referralCode.code}`)}`, '_blank')}
                          className="btn-secondary flex items-center justify-center space-x-2"
                        >
                          <span>QR</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* User doesn't have a referral code yet */
                  <div className="glass-dark rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-6">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4">
                      🎉 Sistema de Referidos - Gana 5%
                    </h3>
                    <div className="mb-4 p-3 glass rounded-lg">
                      <p className="text-football-green text-sm">
                        📍 Tu Wallet: {connectedWalletAddress?.slice(0, 6)}...{connectedWalletAddress?.slice(-4)}
                      </p>
                    </div>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Crea tu código de referido único y gana 5% de comisión de TODAS las compras que hagan tus amigos ¡PARA SIEMPRE!
                    </p>
                    
                    <button
                      onClick={handleCreateReferralCode}
                      disabled={createReferralCodeMutation.isPending}
                      className="btn-primary flex items-center space-x-2 mx-auto text-lg px-8 py-4 disabled:opacity-50"
                    >
                      {createReferralCodeMutation.isPending ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <LinkIcon className="w-6 h-6" />
                          <span>🎯 CREAR MI CÓDIGO DE REFERIDO</span>
                        </>
                      )}
                    </button>
                    
                    <div className="mt-6 p-4 glass rounded-lg max-w-md mx-auto">
                      <h4 className="text-football-green font-semibold mb-2">💡 ¿Cómo funciona?</h4>
                      <ul className="text-sm text-gray-400 space-y-1 text-left">
                        <li>• Creas tu código único</li>
                        <li>• Compartes tu link especial</li>
                        <li>• Tus amigos se registran con tu código</li>
                        <li>• ¡Ganas 5% de TODAS sus compras!</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Instructions */}
                <div className="glass-dark rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">📈 Maximiza tus Ganancias</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold">1</span>
                      </div>
                      <h5 className="font-semibold text-white mb-2">Comparte en Redes</h5>
                      <p className="text-gray-400 text-sm">
                        Twitter, Instagram, TikTok, YouTube
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold">2</span>
                      </div>
                      <h5 className="font-semibold text-white mb-2">Invita Amigos</h5>
                      <p className="text-gray-400 text-sm">
                        Gamers y fanáticos del fútbol
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-bold">3</span>
                      </div>
                      <h5 className="font-semibold text-white mb-2">Gana Comisiones</h5>
                      <p className="text-gray-400 text-sm">
                        5% automático de cada compra
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
                  ) : transactionsList.length > 0 ? (
                    <div className="space-y-4">
                      {transactionsList.slice(0, 10).map((transaction) => (
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

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentProfile={{
          displayName: profileData.displayName,
          bio: profileData.bio,
          avatar: profileData.avatar,
          preferences: {
            notifications: {
              gameResults: true,
              newPlayerPacks: true,
              tournamentInvitations: false,
            },
            language: 'en',
          },
        }}
        onProfileUpdate={(updatedData) => {
          // Actualizar el estado del usuario actual
          setCurrentUser(prev => ({
            ...prev,
            displayName: updatedData.displayName || prev.displayName,
            bio: updatedData.bio || prev.bio,
            avatar: updatedData.avatar || prev.avatar,
          }));
          
          // Actualizar profileData también
          setProfileData(prev => ({
            ...prev,
            displayName: updatedData.displayName || prev.displayName,
            bio: updatedData.bio || prev.bio,
            avatar: updatedData.avatar || prev.avatar,
          }));
        }}
      />
    </div>
  );
};

export default ProfilePage;
