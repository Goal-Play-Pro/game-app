import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Users, Zap, Trophy, ArrowLeft, ArrowRight, Star } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlayerStatsDisplay from '../components/player/PlayerStatsDisplay';
import FarmingInterface from '../components/player/FarmingInterface';
import { SessionType, PenaltyDirection } from '../types';
import { useAuthStatus } from '../hooks/useAuthStatus';
import { logWalletRequirement } from '../utils/wallet.utils';
import { Link } from 'react-router-dom';

const GamePage = () => {
  const [gameMode, setGameMode] = useState<'select' | 'playing' | 'result'>('select');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [currentSession, setCurrentSession] = useState<string>('');
  const [penaltyDirection, setPenaltyDirection] = useState<PenaltyDirection | null>(null);
  const [penaltyPower, setPenaltyPower] = useState<number>(75);
  const [gameResult, setGameResult] = useState<any>(null);
  const [showPlayerDetails, setShowPlayerDetails] = useState<string>('');
  const isAuthenticated = useAuthStatus();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      logWalletRequirement('Game page');
    }
  }, [isAuthenticated]);

  // Fetch user's owned players
  const { data: ownedPlayers, isLoading: playersLoading } = useQuery({
    queryKey: ['owned-players'],
    queryFn: ApiService.getOwnedPlayers,
    enabled: isAuthenticated,
    retry: isAuthenticated ? 3 : false,
    retryDelay: 2000,
    refetchInterval: isAuthenticated ? 30000 : false,
  });

  // Fetch active sessions
  const { data: sessions } = useQuery({
    queryKey: ['penalty-sessions'],
    queryFn: ApiService.getUserSessions,
    enabled: isAuthenticated,
    refetchInterval: isAuthenticated ? 5000 : false,
    retry: isAuthenticated ? 3 : false,
    retryDelay: 2000,
  });

  // Fetch farming status for selected player
  const { data: farmingStatus } = useQuery({
    queryKey: ['farming-status', selectedPlayer],
    queryFn: () => ApiService.getFarmingStatus(selectedPlayer),
    enabled: isAuthenticated && !!selectedPlayer,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch player progression for selected player
  const { data: playerProgression } = useQuery({
    queryKey: ['player-progression', selectedPlayer],
    queryFn: () => ApiService.getPlayerProgression(selectedPlayer),
    enabled: isAuthenticated && !!selectedPlayer,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch current session details if we have an active session
  const { data: sessionDetails } = useQuery({
    queryKey: ['session-details', currentSession],
    queryFn: () => ApiService.getSessionDetails(currentSession),
    enabled: isAuthenticated && !!currentSession,
    refetchInterval: isAuthenticated && !!currentSession ? 2000 : false,
    retry: 2,
  });

  const ownedPlayersList = Array.isArray(ownedPlayers) ? ownedPlayers : [];
  const sessionStatus = typeof sessionDetails?.status === 'string' ? sessionDetails.status : undefined;
  const sessionStatusClass = sessionStatus === 'in_progress'
    ? 'text-green-400'
    : sessionStatus === 'completed'
      ? 'text-blue-400'
      : 'text-yellow-400';
  const sessionStatusLabel = sessionStatus ? sessionStatus.replace('_', ' ').toUpperCase() : 'UNKNOWN';

  // Create penalty session mutation
  const createSessionMutation = useMutation({
    mutationFn: ({ type, playerId, maxRounds }: { type: SessionType; playerId: string; maxRounds: number }) =>
      ApiService.createPenaltySession(type, playerId, maxRounds),
    onSuccess: (data) => {
      console.log('✅ Session created successfully:', data);
      setCurrentSession(data.id);
      setGameMode('playing');
      queryClient.invalidateQueries({ queryKey: ['penalty-sessions'] });
    },
    onError: (error) => {
      console.error('❌ Error creating session:', error);
      alert('Failed to create game session. Please try again.');
    },
  });

  // Attempt penalty mutation
  const attemptPenaltyMutation = useMutation({
    mutationFn: ({ sessionId, direction, power }: { sessionId: string; direction: PenaltyDirection; power: number }) =>
      ApiService.attemptPenalty(sessionId, direction, power),
    onSuccess: async (data) => {
      console.log('✅ Penalty attempt successful:', data);
      setGameResult(data);
      queryClient.invalidateQueries({ queryKey: ['penalty-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['session-details', currentSession] });
      
      // Update player experience
      if (data.isGoal) {
        queryClient.invalidateQueries({ queryKey: ['owned-players'] });
        queryClient.invalidateQueries({ queryKey: ['player-progression', selectedPlayer] });
      }
      
      // Check if game is completed
      if (data.sessionStatus === 'completed') {
        setTimeout(() => {
          setGameMode('result');
        }, 2000);
      }
    },
    onError: (error) => {
      console.error('❌ Error attempting penalty:', error);
      alert('Failed to attempt penalty. Please try again.');
    },
  });

  const handleStartGame = (type: SessionType) => {
    if (!selectedPlayer) {
      alert('Please select a player first!');
      return;
    }

    // Check if player can play (has completed farming)
    if (farmingStatus && !farmingStatus.canPlay) {
      alert(`Player needs training! ${farmingStatus.reason}`);
      return;
    }
    
    console.log(`🎮 Starting ${type} game with player ${selectedPlayer}`);
    createSessionMutation.mutate({
      type,
      playerId: selectedPlayer,
      maxRounds: 5
    });
  };

  const handlePenaltyShot = () => {
    if (!penaltyDirection || !currentSession) return;

    console.log(`⚽ Attempting penalty: ${penaltyDirection} with ${penaltyPower}% power`);
    attemptPenaltyMutation.mutate({
      sessionId: currentSession,
      direction: penaltyDirection,
      power: penaltyPower
    });

    // Reset for next shot
    setPenaltyDirection(null);
    setPenaltyPower(75);
  };

  const resetGame = () => {
    setGameMode('select');
    setCurrentSession('');
    setGameResult(null);
    setPenaltyDirection(null);
    setPenaltyPower(75);
    setSelectedPlayer('');
  };

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <div className="glass-dark rounded-xl p-10 text-center space-y-4 max-w-md">
          <Trophy className="w-12 h-12 text-gray-500 mx-auto" />
          <h2 className="text-2xl font-display text-white">Connect your wallet</h2>
          <p className="text-gray-400">
            Sign in to select players and compete in penalty shootouts.
          </p>
        </div>
      </div>
    );
  }

  if (playersLoading) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading your players..." />
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {gameMode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Header */}
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
                  Penalty Shootout
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Choose your player and game mode to start your penalty shootout experience
                </p>
                
                {/* API Connection Status */}
                <div className="mt-4 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-green-400 text-sm">Connected to production API</span>
                </div>
              </div>

              {/* Player Selection */}
              <div className="glass-dark rounded-xl p-6">
                <h2 className="text-2xl font-semibold text-white mb-6">Select Your Player</h2>
                
                {ownedPlayersList.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">No Players Available</h3>
                    <p className="text-gray-400 mb-6">You need to own at least one player to start playing</p>
                    <a href="/shop" className="btn-primary">
                      Get Player Packs
                    </a>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {ownedPlayersList.map((player) => (
                      <motion.div
                        key={player.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedPlayer(player.id)}
                        className={`game-card cursor-pointer ${
                          selectedPlayer === player.id ? 'ring-2 ring-football-green' : ''
                        }`}
                      >
                        {/* Player Image */}
                        <div className="aspect-square bg-gradient-to-br from-football-green/20 to-football-blue/20 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                          {player.player?.imageUrl ? (
                            <img
                              src={player.player.imageUrl}
                              alt={player.player.name || `Player ${player.id.slice(0, 6)}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="hidden w-full h-full bg-gradient-to-r from-football-green to-football-blue items-center justify-center">
                            <span className="text-white font-bold text-2xl">⚽</span>
                          </div>
                        </div>
                        
                        {/* Player Status Indicators */}
                        <div className="absolute top-2 right-2 flex space-x-1">
                          <div className="bg-football-green text-white text-xs font-bold px-2 py-1 rounded-full">
                            LV {player.currentLevel}
                          </div>
                          {selectedPlayer === player.id && farmingStatus && (
                            <div className={`text-white text-xs font-bold px-2 py-1 rounded-full ${
                              farmingStatus.canPlay ? 'bg-green-500' : 'bg-yellow-500'
                            }`}>
                              {farmingStatus.canPlay ? 'READY' : 'TRAINING'}
                            </div>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold text-white mb-2">
                          {player.player?.name || `Player #${player.id.slice(0, 6)}`}
                        </h3>
                        <div className="text-sm text-gray-400">
                          <div>Level: {player.currentLevel}</div>
                          <div>XP: {player.experience}</div>
                          {player.player?.position && (
                            <div className="capitalize">Position: {player.player.position}</div>
                          )}
                          {player.player?.rarity && (
                            <div className="capitalize text-football-green">Rarity: {player.player.rarity}</div>
                          )}
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="mt-3 flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPlayerDetails(showPlayerDetails === player.id ? '' : player.id);
                            }}
                            className="btn-secondary text-xs py-1 px-2 flex-1"
                          >
                            {showPlayerDetails === player.id ? 'Hide' : 'Stats'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Player Details */}
                {showPlayerDetails && playerProgression && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <PlayerStatsDisplay
                      playerStats={playerProgression.totalStats}
                      division={ownedPlayersList.find(p => p.id === showPlayerDetails)?.player?.division || 'tercera'}
                      currentLevel={playerProgression.level}
                      experience={playerProgression.experience}
                      showProbability={true}
                      showProgression={true}
                    />
                  </motion.div>
                )}

                {/* Training Interface for Selected Player */}
                {selectedPlayer && farmingStatus && !farmingStatus.canPlay && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <FarmingInterface
                      ownedPlayerId={selectedPlayer}
                      playerName={ownedPlayersList.find(p => p.id === selectedPlayer)?.player?.name || `Player #${selectedPlayer.slice(0, 6)}`}
                      division={ownedPlayersList.find(p => p.id === selectedPlayer)?.player?.division || 'tercera'}
                      currentLevel={ownedPlayersList.find(p => p.id === selectedPlayer)?.currentLevel || 1}
                      experience={ownedPlayersList.find(p => p.id === selectedPlayer)?.experience || 0}
                    />
                  </motion.div>
                )}
              </div>

              {/* Game Mode Selection */}
              {selectedPlayer && farmingStatus?.canPlay && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark rounded-xl p-6"
                >
                  <h2 className="text-2xl font-semibold text-white mb-6">Choose Game Mode</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStartGame(SessionType.SINGLE_PLAYER)}
                      disabled={createSessionMutation.isPending}
                      className="game-card text-left p-8 hover:bg-white/20 disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">Single Player</h3>
                          <p className="text-gray-400">Practice against AI</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Perfect your penalty skills against our advanced AI goalkeeper. 
                        Great for practice and earning experience points.
                      </p>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleStartGame(SessionType.MULTIPLAYER)}
                      disabled={createSessionMutation.isPending}
                      className="game-card text-left p-8 hover:bg-white/20 disabled:opacity-50"
                    >
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white">Multiplayer</h3>
                          <p className="text-gray-400">Challenge other players</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm">
                        Compete against real players from around the world. 
                        Win matches to climb the leaderboard and earn bigger rewards.
                      </p>
                    </motion.button>
                  </div>

                  {createSessionMutation.isPending && (
                    <div className="mt-6 flex justify-center">
                      <LoadingSpinner text="Creating game session..." />
                    </div>
                  )}
                </motion.div>
              )}

              {/* Training Required Message */}
              {selectedPlayer && farmingStatus && !farmingStatus.canPlay && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-dark rounded-xl p-6 text-center"
                >
                  <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-yellow-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Training Required</h3>
                  <p className="text-gray-400 mb-4">{farmingStatus.reason}</p>
                  <div className="text-sm text-yellow-400">
                    Training Progress: {farmingStatus.farmingProgress}%
                  </div>
                  <div className="mt-4">
                    <a href="/inventory" className="btn-primary">
                      Go to Training
                    </a>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {gameMode === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Game Header */}
              <div className="text-center">
                <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
                  Penalty Shootout
                </h1>
                {sessionDetails && (
                  <div className="flex items-center justify-center space-x-8 text-lg">
                    <div className="text-white">
                      <span className="text-gray-400">Round:</span> {sessionDetails.currentRound}/{sessionDetails.maxRounds}
                    </div>
                    <div className="text-white">
                      <span className="text-gray-400">Score:</span> {sessionDetails.hostScore} - {sessionDetails.guestScore}
                    </div>
                    <div className="text-white">
                      <span className="text-gray-400">Status:</span> 
                      <span className={`ml-1 ${sessionStatusClass}`}>
                        {sessionStatusLabel}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Football Field */}
              <div className="glass-dark rounded-xl p-8">
                <div className="relative aspect-video bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden">
                  {/* Goal */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-16 border-2 border-white">
                    {/* Goal sections for targeting */}
                    <div className="grid grid-cols-3 h-full">
                      {['left', 'center', 'right'].map((direction) => (
                        <button
                          key={direction}
                          onClick={() => setPenaltyDirection(direction as PenaltyDirection)}
                          className={`border border-white/30 hover:bg-white/20 transition-colors ${
                            penaltyDirection === direction ? 'bg-football-green/50' : ''
                          }`}
                        >
                          <span className="text-white text-xs font-semibold">
                            {direction.toUpperCase()}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ball */}
                  <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white rounded-full"></div>

                  {/* Player */}
                  <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-football-blue rounded-full"></div>
                </div>

                {/* Controls */}
                <div className="mt-6 space-y-6">
                  {/* Direction Selection */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-4">Select Direction</h3>
                    <div className="flex justify-center space-x-4">
                      {[
                        { direction: 'left' as PenaltyDirection, label: 'Left', icon: ArrowLeft },
                        { direction: 'center' as PenaltyDirection, label: 'Center', icon: Target },
                        { direction: 'right' as PenaltyDirection, label: 'Right', icon: ArrowRight }
                      ].map(({ direction, label, icon: Icon }) => (
                        <button
                          key={direction}
                          onClick={() => setPenaltyDirection(direction)}
                          className={`btn-secondary flex items-center space-x-2 ${
                            penaltyDirection === direction ? 'bg-football-green text-white' : ''
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Power Selection */}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Power: {penaltyPower}%
                    </h3>
                    <div className="max-w-md mx-auto">
                      <input
                        type="range"
                        min="10"
                        max="100"
                        value={penaltyPower}
                        onChange={(e) => setPenaltyPower(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #00b894 0%, #00b894 ${penaltyPower}%, #374151 ${penaltyPower}%, #374151 100%)`
                        }}
                      />
                      <div className="flex justify-between text-sm text-gray-400 mt-2">
                        <span>Safe</span>
                        <span>Optimal</span>
                        <span>Risky</span>
                      </div>
                    </div>
                  </div>

                  {/* Shoot Button */}
                  <div className="text-center">
                    <button
                      onClick={handlePenaltyShot}
                      disabled={!penaltyDirection || attemptPenaltyMutation.isPending}
                      className="btn-primary text-xl px-12 py-4 disabled:opacity-50"
                    >
                      {attemptPenaltyMutation.isPending ? (
                        <LoadingSpinner size="sm" color="white" />
                      ) : (
                        <>
                          <Zap className="w-6 h-6 mr-2" />
                          SHOOT!
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Game Result Display */}
              {gameResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass-dark rounded-xl p-6 text-center"
                >
                  <div className={`text-2xl font-bold mb-2 ${
                    gameResult.isGoal ? 'text-football-green' : 'text-red-400'
                  }`}>
                    {gameResult.isGoal ? '⚽ GOAL!' : '❌ MISS!'}
                  </div>
                  <p className="text-gray-300">{gameResult.description}</p>
                  {sessionDetails && (
                    <div className="mt-4 space-y-2">
                      <div className="text-lg">
                        Score: {sessionDetails.hostScore} - {sessionDetails.guestScore}
                      </div>
                      <div className="text-sm text-gray-400">
                        Round {sessionDetails.currentRound} of {sessionDetails.maxRounds}
                      </div>
                      {sessionStatus === 'completed' && sessionDetails.winnerId && (
                        <div className="text-football-green font-semibold">
                          {sessionDetails.winnerId === sessionDetails.hostUserId ? 'You Won!' : 'You Lost!'}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {gameMode === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-8"
            >
              <div className="glass-dark rounded-xl p-8">
                <div className="w-20 h-20 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                
                <h1 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
                  Game Complete!
                </h1>
                
                {sessionDetails && (
                  <div className="space-y-4 mb-6">
                    <div className="text-2xl text-white">
                      Final Score: {sessionDetails.hostScore} - {sessionDetails.guestScore}
                    </div>
                    {sessionDetails.winnerId && (
                      <div className={`text-xl font-semibold ${
                        sessionDetails.winnerId === sessionDetails.hostUserId ? 'text-football-green' : 'text-red-400'
                      }`}>
                        {sessionDetails.winnerId === sessionDetails.hostUserId ? '🏆 Victory!' : '😔 Defeat'}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-4 mb-8">
                  <div className="text-lg text-gray-300">
                    🏆 Experience Gained: +{gameResult?.isGoal ? '50' : '15'} XP
                  </div>
                  <div className="text-lg text-gray-300">
                    💰 Rewards Earned: ${sessionDetails?.winnerId === sessionDetails?.hostUserId ? '25.00' : '5.00'}
                  </div>
                  <div className="text-lg text-gray-300">
                    📊 Statistics: Recorded in your profile
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button onClick={resetGame} className="btn-primary">
                    Play Again
                  </button>
                  <Link to="/shop" className="btn-primary">
                    View Leaderboard
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GamePage;
