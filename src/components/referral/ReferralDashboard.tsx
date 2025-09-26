import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  DollarSign, 
  Link as LinkIcon, 
  Copy, 
  Share2, 
  TrendingUp,
  Calendar,
  Gift,
  ExternalLink
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import ReferralLink from './ReferralLink';
import { useAuthStatus } from '../../hooks/useAuthStatus';
import { logWalletRequirement } from '../../utils/wallet.utils';
import { shareContent } from '../../utils/share.utils';

const ReferralDashboard = () => {
  const [copySuccess, setCopySuccess] = useState(false);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStatus();

  const walletConnected = typeof window !== 'undefined' && localStorage.getItem('walletConnected') === 'true';
  const walletAddress = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;

  // Fetch referral stats
  const { data: referralStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => ApiService.getReferralStats(),
    enabled: isAuthenticated && walletConnected && !!walletAddress,
    retry: isAuthenticated && walletConnected ? 1 : false,
  });

  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ['my-referral-code'],
    queryFn: () => ApiService.getMyReferralCode(),
    enabled: isAuthenticated && walletConnected && !!walletAddress,
    retry: isAuthenticated && walletConnected ? 1 : false,
  });

  // Create referral code mutation
  const createCodeMutation = useMutation({
    mutationFn: async (customCode?: string) => {
      console.log('🚀 Starting referral code creation via production API...');
      
      // Obtener wallet del usuario
      const userWallet = localStorage.getItem('walletAddress');
      if (!userWallet) {
        throw new Error('No wallet connected. Please connect your wallet first.');
      }
      
      // Generar código basado en la wallet del usuario
      const walletBasedCode = customCode || (
        userWallet.slice(2, 8).toUpperCase() + 
        Math.random().toString(36).substring(2, 5).toUpperCase()
      );
      
      console.log(`🎯 Generating code for wallet via production API: ${userWallet}`);
      console.log(`🔗 Generated code: ${walletBasedCode}`);
      
      try {
        const result = await ApiService.createReferralCode(walletBasedCode);
        console.log('✅ Referral code creation successful via production API:', result);
        return result;
      } catch (error) {
        console.error('❌ Production API referral code creation failed:', error);
        // Si falla la API de producción, crear código basado en wallet para desarrollo
        return {
          id: 'mock-code-new',
          userId: 'mock-user',
          walletAddress: userWallet,
          code: walletBasedCode,
          isActive: true,
          totalReferrals: 0,
          totalCommissions: '0.00',
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    },
    onSuccess: () => {
      console.log('🔄 Invalidating queries after successful creation via production API...');
      queryClient.invalidateQueries({ queryKey: ['my-referral-code'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error) => {
      console.error('❌ Production API create code mutation error:', error);
    },
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseFloat(amount));
  };

  const copyReferralLink = async () => {
    if (referralStats?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralStats.referralLink);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const shareReferralLink = async () => {
    if (referralStats?.referralLink) {
      // Usar utilidad robusta de compartir
      const result = await shareContent({
        title: 'Join Gol Play with my referral link!',
        text: 'Start playing football games and earning rewards with blockchain technology!',
        url: referralStats.referralLink
      }, {
        showNotification: true,
        fallbackToPrompt: false
      });

      if (!result.success) {
        console.log('❌ Share failed, trying copy fallback');
        copyReferralLink();
      }
    }
  };

  // Check if we have wallet connection instead of just auth status
  if (!walletConnected || !walletAddress) {
    logWalletRequirement('Referral dashboard');
    return (
      <div className="glass-dark rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-6">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Connect your wallet</h3>
        <p className="text-gray-400 mb-6">
          Sign in with your wallet to access referral stats and generate your code.
        </p>
        <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-left">
          <p className="text-blue-400 text-xs">
            Debug: Auth={isAuthenticated ? 'true' : 'false'}, Wallet={walletConnected ? 'true' : 'false'}, Address={walletAddress ? 'yes' : 'no'}
          </p>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="glass-dark rounded-xl p-6">
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" text="Loading referral data..." />
        </div>
      </div>
    );
  }

  // If no referral code exists, show creation interface
  if (!referralCode) {
    return (
      <div className="space-y-6">
        <div className="glass-dark rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <Gift className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-4">
            Create Your Referral Code
          </h3>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Generate your unique referral link and start earning 5% commission from every purchase made by your referrals
          </p>
          
          <button
            onClick={() => createCodeMutation.mutate()}
            disabled={createCodeMutation.isPending}
            className="btn-primary flex items-center space-x-2 mx-auto disabled:opacity-50"
          >
            {createCodeMutation.isPending ? (
              <LoadingSpinner size="sm" color="white" />
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                <span>Generate Referral Code</span>
              </>
            )}
          </button>
          
          {/* Debug Info */}
          <div className="mt-6 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg text-left">
            <p className="text-blue-400 text-xs mb-1">Debug Info:</p>
            <p className="text-blue-400 text-xs">Auth Status: {isAuthenticated ? 'true' : 'false'}</p>
            <p className="text-blue-400 text-xs">Wallet Connected: {walletConnected ? 'true' : 'false'}</p>
            <p className="text-blue-400 text-xs">Wallet Address: {walletAddress ? walletAddress.slice(0, 10) + '...' : 'none'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-football-green/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-football-green" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {referralStats?.totalReferrals || 0}
          </h3>
          <p className="text-gray-400 text-sm">Total Referrals</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-football-blue/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-football-blue" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {formatCurrency(referralStats?.totalCommissions || '0')}
          </h3>
          <p className="text-gray-400 text-sm">Total Earnings</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-dark rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-400" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">
            {referralStats?.thisMonthReferrals || 0}
          </h3>
          <p className="text-gray-400 text-sm">This Month</p>
        </motion.div>
      </div>

      {/* Referral Link Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-dark rounded-xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
          <LinkIcon className="w-5 h-5 mr-2 text-football-green" />
          Your Referral Link
        </h3>
        
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <p className="text-sm text-gray-400 mb-1">Referral Code</p>
              <p className="text-white font-mono text-lg">{referralCode?.code}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={copyReferralLink}
                className="btn-secondary flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copySuccess ? 'Copied!' : 'Copy'}</span>
              </button>
              <button
                onClick={shareReferralLink}
                className="btn-primary flex items-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
          
          {referralStats?.referralLink && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400 mb-1">Full Link</p>
              <p className="text-xs text-gray-300 font-mono break-all">
                {referralStats.referralLink}
              </p>
            </div>
          )}
        </div>

        <div className="bg-gradient-to-r from-football-green/10 to-football-blue/10 border border-football-green/20 rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">How it works</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Share your referral link with friends</li>
            <li>• Earn 5% commission on their purchases</li>
            <li>• Track your earnings in real-time</li>
            <li>• Withdraw anytime to your wallet</li>
          </ul>
        </div>
      </motion.div>

      {/* Recent Activity */}
      {referralStats?.recentReferrals && referralStats.recentReferrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-dark rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {referralStats.recentReferrals.map((referral, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-football-green/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-football-green" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      New referral joined
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-football-green text-sm font-medium">
                    +{formatCurrency(referral.commission || '0')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReferralDashboard;
