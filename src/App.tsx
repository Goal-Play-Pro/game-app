import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import { useReferral } from './hooks/useReferral'
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
import AIAgent from './components/ai/AIAgent'

function App() {
  const { registerPendingReferral } = useReferral();

  // Check for pending referral registration on app load
  useEffect(() => {
    const checkPendingReferral = async () => {
      const pendingCode = localStorage.getItem('pendingReferralCode');
      if (pendingCode) {
        console.log('📝 Pending referral code found, will register after wallet connection');
      }
    };
    
    checkPendingReferral();
  }, []);

  return (
    <div className="min-h-screen bg-dark-500 text-white relative overflow-hidden">
      {/* Floating Particles Background */}
      <FloatingParticles />
      
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