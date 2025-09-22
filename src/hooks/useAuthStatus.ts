import { useEffect, useState } from 'react';
import ApiService from '../services/api';
import { API_CONFIG } from '../config/api.config';

export const useAuthStatus = (): boolean => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => ApiService.isAuthenticated());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncStatus = () => setIsAuthenticated(ApiService.isAuthenticated());

    const handleStorage = (event: StorageEvent) => {
      if (event.key === API_CONFIG.AUTH.TOKEN_KEY) {
        syncStatus();
      }
    };

    window.addEventListener('storage', handleStorage);

    const interval = window.setInterval(syncStatus, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(interval);
    };
  }, []);

  return isAuthenticated;
};
