import { useEffect, useState } from 'react';
import ApiService from '../services/api';

const isWalletConnected = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem('walletConnected') === 'true';
  } catch {
    return false;
  }
};

export const useAuthStatus = (): boolean => {
  const [authenticated, setAuthenticated] = useState(() => ApiService.isAuthenticated());

  useEffect(() => {
    let mounted = true;

    const updateState = (hasSession: boolean) => {
      if (!mounted) {
        return;
      }

      setAuthenticated((prev) => {
        if (prev !== hasSession) {
          console.log(`🔐 Auth status changed: ${hasSession ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
        }
        return hasSession;
      });
    };

    const syncStatus = async (forceCheck = false) => {
      const walletConnected = isWalletConnected();

      if (!walletConnected && !ApiService.isAuthenticated()) {
        updateState(false);
        ApiService.markSessionActive(false);

        if (!forceCheck) {
          return;
        }
      }

      const hasSession = ApiService.isAuthenticated() || (await ApiService.ensureSession());
      updateState(hasSession);
    };

    const initialShouldCheck = ApiService.isAuthenticated() || isWalletConnected();
    syncStatus(initialShouldCheck);

    const interval = window.setInterval(() => {
      if (!isWalletConnected() && !ApiService.isAuthenticated()) {
        return;
      }
      syncStatus();
    }, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return authenticated;
};
