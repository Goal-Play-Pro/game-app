import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Settings, TrendingUp, Star, Palette, Trophy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlayerStatsDisplay from '../components/player/PlayerStatsDisplay';
import FarmingInterface from '../components/player/FarmingInterface';
import { useAuthStatus } from '../hooks/useAuthStatus';

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState<'players' | 'kits' | 'stats' | 'farming'>('players');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const isAuthenticated = useAuthStatus();

  // Fetch user's owned players
  const { data: ownedPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['owned-players'],
    queryFn: ApiService.getOwnedPlayers,
    enabled: isAuthenticated,
    retry: isAuthenticated ? 3 : false,
  });

  // Fetch player progression for selected player
  const { data: playerProgression, isLoading: progressionLoading } = useQuery({
    queryKey: ['player-progression', selectedPlayer],
    queryFn: () => ApiService.getPlayerProgression(selectedPlayer),
    enabled: isAuthenticated && !!selectedPlayer,
  });

  // Fetch player kit for selected player
  const { data: playerKit, isLoading: kitLoading } = useQuery({
    queryKey: ['player-kit', selectedPlayer],
    queryFn: () => ApiService.getPlayerKit(selectedPlayer),
    enabled: isAuthenticated && !!selectedPlayer,
  });

  // Fetch farming status for selected player
  const { data: farmingStatus, isLoading: farmingLoading } = useQuery({
    queryKey: ['farming-status', selectedPlayer],
    queryFn: () => ApiService.getFarmingStatus(selectedPlayer),
    enabled: isAuthenticated && !!selectedPlayer,
    refetchInterval: isAuthenticated && !!selectedPlayer ? 5000 : false,
  });

  const tabs = [
    { id: 'players', label: 'My Players', icon: Users },
    { id: 'kits', label: 'Player Kits', icon: Palette },
    { id: 'stats', label: 'Statistics', icon: TrendingUp },
    { id: 'farming', label: 'Training', icon: Star },
  ];

  const getRarityColor = (level: number) => {
    if (level >= 20) return 'from-yellow-400 to-orange-500';
    if (level >= 15) return 'from-purple-400 to-pink-500';
    if (level >= 10) return 'from-blue-400 to-cyan-500';
    if (level >= 5) return 'from-green-400 to-emerald-500';
    return 'from-gray-400 to-gray-500';
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <div className="glass-dark rounded-xl p-10 text-center space-y-4 max-w-md">
          <Users className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-2xl font-display text-white">Connect your wallet</h2>
          <p className="text-gray-400">
            Sign in with your wallet to view and manage your player inventory.
          </p>
        </div>
      </div>
    );
  }

  if (playersLoading) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your inventory..." />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
            My Inventory
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Manage your player collection, customize kits, and track your progress
          </p>
        </motion.div>

        {/* Inventory Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {ownedPlayers?.length || 0}
            </div>
            <div className="text-sm text-gray-400">Total Players</div>
          </div>
          
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {ownedPlayers?.reduce((sum, p) => sum + p.currentLevel, 0) || 0}
            </div>
            <div className="text-sm text-gray-400">Total Levels</div>
          </div>
          
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {ownedPlayers?.reduce((sum, p) => sum + p.experience, 0) || 0}
            </div>
            <div className="text-sm text-gray-400">Total XP</div>
          </div>
          
          <div className="glass-dark rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white mb-1">
              {ownedPlayers?.filter(p => p.currentLevel >= 10).length || 0}
            </div>
            <div className="text-sm text-gray-400">Elite Players</div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center space-x-1 mb-8 glass-dark rounded-lg p-1"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-football-green text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'players' && (
            <div className="space-y-6">
              {!ownedPlayers || ownedPlayers.length === 0 ? (
                <div className="glass-dark rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Players Yet</h3>
                  <p className="text-gray-400 mb-6">Start building your team by opening player packs</p>
                  <a href="/shop" className="btn-primary">
                    Get Player Packs
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {ownedPlayers.map((player) => (
                    <motion.div
                      key={player.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedPlayer(player.id)}
                      className={`game-card cursor-pointer ${
                        selectedPlayer === player.id ? 'ring-2 ring-football-green' : ''
                      }`}
                    >
                      {/* Player Card */}
                      <div className="relative">
                        <div className="aspect-square bg-gradient-to-br from-football-green/20 to-football-blue/20 rounded-lg mb-4 flex items-center justify-center">
                          <div className={`w-16 h-16 bg-gradient-to-r ${getRarityColor(player.currentLevel)} rounded-full flex items-center justify-center`}>
                            <span className="text-white font-bold text-xl">P</span>
                          </div>
                        </div>
                        
                        {/* Level Badge */}
                        <div className="absolute top-2 right-2 bg-football-green text-white text-xs font-bold px-2 py-1 rounded-full">
                          LV {player.currentLevel}
                        </div>
                        
                        {/* Training Status Badge */}
                        {selectedPlayer === player.id && farmingStatus && (
                          <div className={`absolute top-2 left-2 text-white text-xs font-bold px-2 py-1 rounded-full ${
                            farmingStatus.canPlay ? 'bg-green-500' : 'bg-yellow-500'
                          }`}>
                            {farmingStatus.canPlay ? 'READY' : 'TRAINING'}
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-white mb-2">
                        Player #{player.id.slice(0, 6)}
                      </h3>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Experience:</span>
                          <span className="text-white">{player.experience} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Acquired:</span>
                          <span className="text-white">
                            {new Date(player.acquiredAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      
                      {/* XP Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>XP Progress</span>
                          <span>{player.experience}/1000</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-football-green to-football-blue h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((player.experience / 1000) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Player Details */}
              {selectedPlayer && playerProgression && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <PlayerStatsDisplay
                    playerStats={playerProgression.totalStats}
                    division={ownedPlayers?.find(p => p.id === selectedPlayer)?.division || 'tercera'}
                    currentLevel={playerProgression.level}
                    experience={playerProgression.experience}
                    showProbability={true}
                    showProgression={true}
                  />
                </motion.div>
              )}
            </div>
          )}

          {activeTab === 'farming' && (
            <div className="space-y-6">
              {selectedPlayer ? (
                <FarmingInterface
                  ownedPlayerId={selectedPlayer}
                  playerName={`Player #${selectedPlayer.slice(0, 6)}`}
                  division={ownedPlayers?.find(p => p.id === selectedPlayer)?.division || 'tercera'}
                  currentLevel={ownedPlayers?.find(p => p.id === selectedPlayer)?.currentLevel || 1}
                  experience={ownedPlayers?.find(p => p.id === selectedPlayer)?.experience || 0}
                />
              ) : (
                <div className="glass-dark rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Player</h3>
                  <p className="text-gray-400">Choose a player from the Players tab to start training</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kits' && (
            <div className="space-y-6">
              {selectedPlayer ? (
                <div className="glass-dark rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-6">Customize Player Kit</h3>
                  
                  {kitLoading ? (
                    <div className="flex justify-center py-8">
                      <LoadingSpinner text="Loading kit..." />
                    </div>
                  ) : playerKit ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Kit Preview */}
                      <div className="text-center">
                        <div 
                          className="w-32 h-32 rounded-lg mx-auto mb-4 flex items-center justify-center"
                          style={{ 
                            background: `linear-gradient(45deg, ${playerKit.primaryColor}, ${playerKit.secondaryColor})` 
                          }}
                        >
                          <span className="text-white font-bold text-2xl">⚽</span>
                        </div>
                        <h4 className="text-lg font-semibold text-white">{playerKit.name}</h4>
                        <p className="text-gray-400 text-sm">Version {playerKit.version}</p>
                      </div>
                      
                      {/* Kit Details */}
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Kit Name</label>
                          <div className="text-gray-300">{playerKit.name}</div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Primary Color</label>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full border border-white/20"
                              style={{ backgroundColor: playerKit.primaryColor }}
                            />
                            <span className="text-gray-300">{playerKit.primaryColor}</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Secondary Color</label>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded-full border border-white/20"
                              style={{ backgroundColor: playerKit.secondaryColor }}
                            />
                            <span className="text-gray-300">{playerKit.secondaryColor}</span>
                          </div>
                        </div>
                        
                        <button className="btn-primary w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Customize Kit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No kit found for this player</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-dark rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Player</h3>
                  <p className="text-gray-400">Choose a player from the Players tab to customize their kit</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Collection Stats */}
                <div className="glass-dark rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Collection</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Players:</span>
                      <span className="text-white font-semibold">{ownedPlayers?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average Level:</span>
                      <span className="text-white font-semibold">
                        {ownedPlayers?.length ? 
                          Math.round(ownedPlayers.reduce((sum, p) => sum + p.currentLevel, 0) / ownedPlayers.length) : 0
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Highest Level:</span>
                      <span className="text-white font-semibold">
                        {ownedPlayers?.length ? Math.max(...ownedPlayers.map(p => p.currentLevel)) : 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Achievement Stats */}
                <div className="glass-dark rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Achievements</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Games Won:</span>
                      <span className="text-white font-semibold">42</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Win Rate:</span>
                      <span className="text-white font-semibold">78%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Best Streak:</span>
                      <span className="text-white font-semibold">12</span>
                    </div>
                  </div>
                </div>

                {/* Rewards Stats */}
                <div className="glass-dark rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Rewards</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Earned:</span>
                      <span className="text-white font-semibold">$1,250.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">This Month:</span>
                      <span className="text-white font-semibold">$320.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Best Day:</span>
                      <span className="text-white font-semibold">$85.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default InventoryPage;
