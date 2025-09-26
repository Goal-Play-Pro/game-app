import { useEffect, useState } from 'react';
import ApiService from '../services/api';

export const useAuthStatus = (): boolean => {
  const [authenticated, setAuthenticated] = useState(() => ApiService.isAuthenticated());

  useEffect(() => {
    let mounted = true;

    const syncStatus = async () => {
      const hasSession = ApiService.isAuthenticated() || (await ApiService.ensureSession());
      if (!mounted) return;
      setAuthenticated((prev) => {
        if (prev !== hasSession) {
          console.log(`🔐 Auth status changed: ${hasSession ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
        }
        return hasSession;
      });
    };

    syncStatus();
    const interval = window.setInterval(syncStatus, 60000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return authenticated;
};
