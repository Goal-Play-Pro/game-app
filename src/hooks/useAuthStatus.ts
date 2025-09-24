import { useEffect, useState } from 'react';
import ApiService from '../services/api';

export const useAuthStatus = (): boolean => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return ApiService.isAuthenticated();
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncStatus = () => {
      const tokenExists = ApiService.isAuthenticated();

      const newAuthStatus = tokenExists;

      if (newAuthStatus !== isAuthenticated) {
        console.log(`🔐 Auth status changed: ${newAuthStatus ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
      }
      
      setIsAuthenticated(newAuthStatus);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'authToken' ||
          event.key === 'jwt_token' ||
          event.key === 'accessToken') {
        syncStatus();
      }
    };

    // Sync inmediatamente
    syncStatus();

    window.addEventListener('storage', handleStorage);
    const interval = window.setInterval(syncStatus, 1500);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  return isAuthenticated;
};
