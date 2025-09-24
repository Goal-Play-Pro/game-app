import { useEffect, useState } from 'react';
import { API_CONFIG } from '../config/api.config';

export const useAuthStatus = (): boolean => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Verificar múltiples fuentes de autenticación
    const token = localStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY) || 
                  localStorage.getItem('authToken') ||
                  localStorage.getItem('jwt_token') ||
                  localStorage.getItem('accessToken');
    
    const walletConnected = localStorage.getItem('walletConnected') === 'true';
    const walletAddress = localStorage.getItem('walletAddress');
    
    // Considerar autenticado si tiene token O wallet conectada
    return !!(token || (walletConnected && walletAddress));
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const syncStatus = () => {
      const token = localStorage.getItem(API_CONFIG.AUTH.TOKEN_KEY) || 
                    localStorage.getItem('authToken') ||
                    localStorage.getItem('jwt_token') ||
                    localStorage.getItem('accessToken');
      
      const walletConnected = localStorage.getItem('walletConnected') === 'true';
      const walletAddress = localStorage.getItem('walletAddress');
      
      const newAuthStatus = !!(token || (walletConnected && walletAddress));
      
      if (newAuthStatus !== isAuthenticated) {
        console.log(`🔐 Auth status changed: ${newAuthStatus ? 'AUTHENTICATED' : 'NOT AUTHENTICATED'}`);
        console.log(`📝 Token exists: ${!!token}`);
        console.log(`🔗 Wallet connected: ${walletConnected}`);
        console.log(`📍 Wallet address: ${walletAddress ? walletAddress.slice(0, 10) + '...' : 'none'}`);
      }
      
      setIsAuthenticated(newAuthStatus);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === API_CONFIG.AUTH.TOKEN_KEY || 
          event.key === 'authToken' ||
          event.key === 'jwt_token' ||
          event.key === 'accessToken' ||
          event.key === 'walletConnected' ||
          event.key === 'walletAddress') {
        syncStatus();
      }
    };

    // Sync inmediatamente
    syncStatus();

    window.addEventListener('storage', handleStorage);

    const interval = window.setInterval(syncStatus, 1000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.clearInterval(interval);
    };
  }, [isAuthenticated]);

  return isAuthenticated;
};
