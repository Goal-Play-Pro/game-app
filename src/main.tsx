import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { API_CONFIG } from './config/api.config'
import App from './App.tsx'
import './index.css'

if (typeof window !== 'undefined') {
  (window as any).__APP_ENV__ = {
    ...(window as any).__APP_ENV__,
    ...import.meta.env,
  };
}

// Log de configuración inicial
console.log('🚀 Goal Play Frontend iniciando...');
console.log('🔗 Production API URL configurada:', API_CONFIG.BASE_URL);
console.log('🌐 Conectando a API de producción en línea...');
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('🎯 Target API:', 'https://game.goalplay.pro/api/');

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // No reintentar si es error de red, usar fallback inmediatamente
        if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      retryDelay: 1000,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
)
