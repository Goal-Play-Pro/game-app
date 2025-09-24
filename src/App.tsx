import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useReferral } from './hooks/useReferral'
import { checkBackendHealth, API_CONFIG } from './config/api.config'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import FloatingParticles from './components/common/FloatingParticles'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import InventoryPage from './pages/InventoryPage'
import ShopPage from './pages/ShopPage'
import ProfilePage from './pages/ProfilePage'
import LeaderboardPage from './pages/LeaderboardPage'
import AboutPage from './pages/AboutPage'
import TokenomicsPage from './pages/TokenomicsPage'
import RoadmapPage from './pages/RoadmapPage'
import VideosPage from './pages/VideosPage'
import AdminPage from './pages/AdminPage'
import AIAgent from './components/ai/AIAgent'

function App() {
  const { registerPendingReferral } = useReferral();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Check for pending referral registration on app load
  useEffect(() => {
    const checkPendingReferral = async () => {
      const pendingCode = localStorage.getItem('pendingReferralCode');
      if (pendingCode) {
        console.log('📝 Pending referral code found, will register after wallet connection');
      }
    };
    
    const checkBackend = async () => {
      console.log('🔍 Checking production API connectivity...');
      const isHealthy = await checkBackendHealth();
      
      if (isHealthy) {
        setBackendStatus('online');
        console.log('✅ Production API is online and responding');
      } else {
        setBackendStatus('offline');
        console.log('⚠️ Production API is offline, using fallback data');
      }
    };
    
    // Función para reconectar automáticamente
    const attemptReconnection = async () => {
      if (backendStatus === 'offline') {
        console.log('🔄 Attempting automatic reconnection to production API...');
        const isHealthy = await checkBackendHealth();
        if (isHealthy) {
          setBackendStatus('online');
          console.log('✅ Reconnection to production API successful!');
        }
      }
    };
    
    checkPendingReferral();
    checkBackend();
    
    // Check backend health every 30 seconds
    const healthInterval = setInterval(checkBackend, 30000);
    
    // Attempt reconnection every 10 seconds if offline
    const reconnectInterval = setInterval(attemptReconnection, 10000);
    
    return () => {
      clearInterval(healthInterval);
      clearInterval(reconnectInterval);
    };
  }, [backendStatus]);

  // Función para forzar reconexión manual
  const forceReconnect = async () => {
    setBackendStatus('checking');
    const isHealthy = await checkBackendHealth();
    setBackendStatus(isHealthy ? 'online' : 'offline');
  };

  return (
    <div className="min-h-screen bg-dark-500 text-white relative overflow-hidden">
      {/* Floating Particles Background */}
      <FloatingParticles />
      
      {/* Backend Status Indicator */}
      {backendStatus !== 'online' && (
        <div className="fixed top-20 left-4 right-4 z-40 max-w-md mx-auto">
          <div className={`glass-dark rounded-xl p-4 border ${
            backendStatus === 'checking' ? 'border-yellow-500/30' : 'border-red-500/30'
          } shadow-xl`}>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                backendStatus === 'checking' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
              }`} />
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">
                  {backendStatus === 'checking' ? 'Conectando a game.goalplay.pro...' : 'Sin conexión al servidor'}
                </p>
                <p className="text-gray-400 text-xs">
                  {backendStatus === 'checking' 
                    ? 'Verificando https://game.goalplay.pro/api/health...'
                    : 'Reintentando cada 5 segundos. Funciones limitadas.'
                  }
                </p>
              </div>
              <button
                onClick={forceReconnect}
                className="text-xs text-football-green hover:text-football-blue transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main App Structure */}
      <div className="relative z-10">
        <Header />
        
        <main className="min-h-screen">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <HomePage />
                </motion.div>
              } />
              
              <Route path="/game" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <GamePage />
                </motion.div>
              } />
              
              <Route path="/inventory" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <InventoryPage />
                </motion.div>
              } />
              
              <Route path="/shop" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ShopPage />
                </motion.div>
              } />
              
              <Route path="/profile" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProfilePage />
                </motion.div>
              } />
              
              <Route path="/leaderboard" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <LeaderboardPage />
                </motion.div>
              } />
              
              <Route path="/about" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AboutPage />
                </motion.div>
              } />
              
              <Route path="/tokenomics" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <TokenomicsPage />
                </motion.div>
              } />
              
              <Route path="/roadmap" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RoadmapPage />
                </motion.div>
              } />
              
              <Route path="/videos" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <VideosPage />
                </motion.div>
              } />
              
              <Route path="/admin" element={
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminPage />
                </motion.div>
              } />
            </Routes>
          </AnimatePresence>
        </main>
        
        <Footer />
      </div>
      
      {/* AI Agent - Positioned at bottom right */}
      <AIAgent />
    </div>
  )
}

export default App