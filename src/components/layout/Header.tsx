import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, User, Bell, Settings, Trophy, ShoppingBag } from 'lucide-react';
import { useWallet } from '../../hooks/useWallet';
import WalletConnect from '../wallet/WalletConnect';
import ReferralBanner from '../referral/ReferralBanner';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { walletType, detectWalletType } = useWallet();

  const navigation = [
    { name: 'Home', href: '/', icon: null },
    { name: 'Game', href: '/game', icon: null },
    { name: 'Inventory', href: '/inventory', icon: null },
    { name: 'Shop', href: '/shop', icon: ShoppingBag },
    { name: 'Videos', href: '/videos', icon: null },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'About', href: '/about', icon: null },
    { name: 'Roadmap', href: '/roadmap', icon: null },
  ];

  const isActive = (path: string) => location.pathname === path;

  const resolvedWalletType = walletType ?? (() => {
    const detected = detectWalletType?.();
    return detected && detected !== 'unknown' ? detected : null;
  })();

  const walletName = (() => {
    if (resolvedWalletType === 'safepal') {
      return 'SafePal';
    }
    if (resolvedWalletType === 'metamask') {
      return 'MetaMask';
    }
    return 'Wallet';
  })();

  return (
    <>
      <ReferralBanner />
      <header className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <motion.div
              className="relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
               src="https://photos.pinksale.finance/file/pinksale-logo-upload/1756173488726-1bb87d41d15fe27b500a4bfcde01bb0e.png"
                alt="Goal Play Logo"
               className="h-8 sm:h-10 w-auto object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                 target.style.display = 'none';
                 const fallback = target.nextElementSibling as HTMLElement;
                 if (fallback) fallback.style.display = 'flex';
                }}
              />
             <div className="hidden h-8 sm:h-10 w-8 sm:w-10 bg-gradient-to-r from-football-green to-football-blue rounded-lg items-center justify-center">
               <span className="text-white font-bold text-sm sm:text-lg">G</span>
             </div>
            </motion.div>
           <span className="font-display font-bold text-lg sm:text-xl gradient-text">
             Goal Play
           </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-3 xl:space-x-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative px-2 py-2 text-xs xl:text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                  isActive(item.href)
                    ? 'text-football-green'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {item.icon && <item.icon className="w-3 h-3 xl:w-4 xl:h-4" />}
                <span className="whitespace-nowrap leading-none">{item.name}</span>
                {isActive(item.href) && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-football-green to-football-blue"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Search Bar */}
          <div className="hidden xl:flex items-center space-x-2">
            <div className="relative">
              <motion.div
                className={`flex items-center ${
                  isSearchOpen ? 'w-40 xl:w-48' : 'w-10'
                } h-10 glass rounded-lg transition-all duration-300`}
                animate={{ width: isSearchOpen ? 192 : 40 }}
              >
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-white transition-colors"
                >
                  <Search className="w-4 h-4" />
                </button>
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.input
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none px-2 text-sm"
                      autoFocus
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* User Actions */}
            <div className="flex items-center space-x-1 xl:space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Bell className="w-4 h-4" />
              </motion.button>
              
              <WalletConnect size="sm" />

              <Link to="/profile">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 glass rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-colors touch-target"
                >
                  <User className="w-4 h-4" />
                </motion.div>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors touch-target"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-dark border-t border-white/10"
          >
            <div className="padding-responsive space-y-4">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-3 glass rounded-lg text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-football-green text-sm"
                />
              </div>

              {/* Mobile Navigation Links */}
              <nav className="space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                      isActive(item.href)
                        ? 'bg-football-green/20 text-football-green'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.icon && <item.icon className="w-5 h-5" />}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile Actions */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <WalletConnect size="md" showDropdown={false} className="w-full" />
                
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="btn-secondary flex items-center justify-center space-x-1 text-xs py-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  
                  <button className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors min-h-[44px] flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </button>
                  
                  <button className="p-2 glass rounded-lg text-gray-400 hover:text-white transition-colors min-h-[44px] flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="pt-3 border-t border-white/10">
                <Link
                  to="/profile?tab=referrals"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center space-x-2 text-xs text-gray-400 hover:text-football-green transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-football-green" />
                  <span>
                    API: game.goalplay.pro • {walletName} Ready • Create Referral Code (5%)
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </header>
    </>
  );
};

export default Header;
