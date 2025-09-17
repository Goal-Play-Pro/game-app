import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ReferralApiService } from '../services/referral.api';

export const useReferral = () => {
  const queryClient = useQueryClient();

  // Register referral mutation
  const registerReferralMutation = useMutation({
    mutationFn: (referralCode: string) => ReferralApiService.registerReferral(referralCode),
    onSuccess: (data) => {
      if (data.success) {
        console.log('✅ Referral registered successfully');
        // Invalidate relevant queries
        queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
      }
    },
  });

  // Check for referral code in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      // Store referral code in localStorage for later registration
      localStorage.setItem('pendingReferralCode', referralCode);
      
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      
      console.log(`📝 Referral code detected: ${referralCode}`);
    }
  }, []);

  // Function to register pending referral after user authentication
  const registerPendingReferral = async () => {
    const pendingCode = localStorage.getItem('pendingReferralCode');
    
    if (pendingCode) {
      try {
        await registerReferralMutation.mutateAsync(pendingCode);
        localStorage.removeItem('pendingReferralCode');
        console.log('✅ Pending referral registered');
      } catch (error) {
        console.error('❌ Error registering referral:', error);
      }
    }
  };

  // Function to validate referral code
  const validateReferralCode = async (code: string) => {
    try {
      const result = await ReferralApiService.validateReferralCode(code);
      return result;
    } catch (error) {
      console.error('Error validating referral code:', error);
      return { valid: false };
    }
  };

  return {
    registerReferralMutation,
    registerPendingReferral,
    validateReferralCode,
  };
};