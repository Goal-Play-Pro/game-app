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

const ReferralDashboard = () => {
  const [copySuccess, setCopySuccess] = useState(false);
  const queryClient = useQueryClient();

  // Fetch referral stats
  const { data: referralStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: () => ApiService.getReferralStats(),
    retry: false,
  });

  // Fetch user's referral code
  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ['my-referral-code'],
    queryFn: () => ApiService.getMyReferralCode(),
    retry: false,
  });

  // Create referral code mutation
  const createCodeMutation = useMutation({
    mutationFn: async (customCode?: string) => {
      console.log('🚀 Starting referral code creation...');
      try {
        const result = await ApiService.createReferralCode(customCode);
        console.log('✅ Referral code creation successful:', result);
        return result;
      } catch (error) {
        console.error('❌ Referral code creation failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('🔄 Invalidating queries after successful creation...');
      queryClient.invalidateQueries({ queryKey: ['my-referral-code'] });
      queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
    },
    onError: (error) => {
      console.error('❌ Create code mutation error:', error);
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
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Join Gol Play with my referral link!',
            text: 'Start playing football games and earning rewards with blockchain technology!',
            url: referralStats.referralLink
          });
        } catch (error) {
          console.log('Share cancelled or failed');
        }
      } else {
        copyReferralLink();
      }
    }
  };

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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold gradient-text mb-2">
          Referral Program
        </h2>
        <p className="text-gray-400">
          Earn 5% commission from every purchase made by your referrals
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {referralStats?.totalReferrals || 0}
          </div>
          <div className="text-sm text-gray-400">Total Referrals</div>
        </div>

        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {referralStats?.activeReferrals || 0}
          </div>
          <div className="text-sm text-gray-400">Active Referrals</div>
        </div>

        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatCurrency(referralStats?.totalCommissions || '0')}
          </div>
          <div className="text-sm text-gray-400">Total Earned</div>
        </div>

        <div className="glass-dark rounded-xl p-4 text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-football-orange to-football-green rounded-full flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatCurrency(referralStats?.thisMonthCommissions || '0')}
          </div>
          <div className="text-sm text-gray-400">This Month</div>
        </div>
      </div>

      {/* Referral Link */}
      {referralStats?.referralLink && referralCode?.code && (
        <ReferralLink 
          referralLink={referralStats.referralLink}
          referralCode={referralCode.code}
        />
      )}

      {/* Commission Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Paid Commissions</h4>
          </div>
          <div className="text-2xl font-bold text-green-400 mb-2">
            {formatCurrency(referralStats?.paidCommissions || '0')}
          </div>
          <div className="text-sm text-gray-400">
            Available in your wallet
          </div>
        </div>

        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
            </div>
            <h4 className="text-lg font-semibold text-white">Pending Commissions</h4>
          </div>
          <div className="text-2xl font-bold text-yellow-400 mb-2">
            {formatCurrency(referralStats?.pendingCommissions || '0')}
          </div>
          <div className="text-sm text-gray-400">
            Processing payments
          </div>
        </div>

        <div className="glass-dark rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-football-blue/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-football-blue" />
            </div>
            <h4 className="text-lg font-semibold text-white">This Month</h4>
          </div>
          <div className="text-2xl font-bold text-football-blue mb-2">
            {formatCurrency(referralStats?.thisMonthCommissions || '0')}
          </div>
          <div className="text-sm text-gray-400">
            Current month earnings
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Referrals */}
        <div className="glass-dark rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Recent Referrals</h4>
          
          {referralStats?.recentReferrals && referralStats.recentReferrals.length > 0 ? (
            <div className="space-y-3">
              {referralStats.recentReferrals.slice(0, 5).map((referral) => (
                <div key={referral.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {referral.referredWallet.slice(0, 6)}...{referral.referredWallet.slice(-4)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(referral.registeredAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-green-400 text-sm font-semibold">
                    Active
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No referrals yet</p>
              <p className="text-sm text-gray-500">Share your link to start earning!</p>
            </div>
          )}
        </div>

        {/* Recent Commissions */}
        <div className="glass-dark rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Recent Commissions</h4>
          
          {referralStats?.recentCommissions && referralStats.recentCommissions.length > 0 ? (
            <div className="space-y-3">
              {referralStats.recentCommissions.slice(0, 5).map((commission) => (
                <div key={commission.id} className="flex items-center justify-between p-3 glass rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      commission.status === 'paid' ? 'bg-green-500/20 text-green-400' :
                      commission.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {formatCurrency(commission.commissionAmount)}
                      </div>
                      <div className="text-sm text-gray-400">
                        From {commission.referredWallet.slice(0, 6)}...{commission.referredWallet.slice(-4)}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${
                    commission.status === 'paid' ? 'text-green-400' :
                    commission.status === 'pending' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {commission.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">No commissions yet</p>
              <p className="text-sm text-gray-500">Commissions appear when referrals make purchases</p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works */}
      <div className="glass-dark rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">How Referral Program Works</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">1</span>
            </div>
            <h5 className="font-semibold text-white mb-2">Share Your Link</h5>
            <p className="text-gray-400 text-sm">
              Share your unique referral link with friends and on social media
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">2</span>
            </div>
            <h5 className="font-semibold text-white mb-2">Friends Join & Buy</h5>
            <p className="text-gray-400 text-sm">
              When they register and make purchases using your link
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold">3</span>
            </div>
            <h5 className="font-semibold text-white mb-2">Earn 5% Commission</h5>
            <p className="text-gray-400 text-sm">
              Receive 5% of every purchase automatically to your wallet
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;