import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Users, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../../services/api';
import { useAuthStatus } from '../../hooks/useAuthStatus';

const ReferralBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const isAuthenticated = useAuthStatus();

  // Check if user has referral code
  const { data: referralCode } = useQuery({
    queryKey: ['my-referral-code', isAuthenticated],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        return await ApiService.getMyReferralCode();
      } catch (error) {
        console.warn('Referral code not available');
        return null;
      }
    },
    retry: false,
  });

  useEffect(() => {
    // Show banner if user doesn't have referral code and hasn't dismissed it
    const dismissed = localStorage.getItem('referralBannerDismissed');
    if (isAuthenticated && !referralCode && !dismissed) {
      setIsVisible(true);
    }
  }, [isAuthenticated, referralCode]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    localStorage.setItem('referralBannerDismissed', 'true');
  };

  const handleCreateCode = () => {
    // Navigate to profile referrals tab
    window.location.href = '/profile?tab=referrals';
  };

  if (!isAuthenticated || !isVisible || isDismissed || referralCode) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-20 left-4 right-4 z-40 max-w-md mx-auto"
      >
        <div className="glass-dark rounded-xl p-4 border border-football-green/30 shadow-xl">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1">
                🎉 Earn with Referrals!
              </h4>
              <p className="text-sm text-gray-300 mb-3">
                Create your referral link and earn 5% commission from every purchase made by your friends!
              </p>
              
              <div className="flex items-center space-x-2 text-xs text-football-green mb-3">
                <Users className="w-4 h-4" />
                <span>Invite friends</span>
                <DollarSign className="w-4 h-4" />
                <span>Earn 5% forever</span>
              </div>
              
              <button
                onClick={handleCreateCode}
                className="btn-primary text-sm py-2 px-4"
              >
                Create Referral Link
              </button>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReferralBanner;
