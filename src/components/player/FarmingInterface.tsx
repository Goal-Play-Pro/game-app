import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Target, 
  Users, 
  Shield, 
  Star,
  Play,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ApiService from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

interface FarmingInterfaceProps {
  ownedPlayerId: string;
  playerName: string;
  division: string;
  currentLevel: number;
  experience: number;
  className?: string;
}

const FarmingInterface = ({ 
  ownedPlayerId, 
  playerName, 
  division, 
  currentLevel, 
  experience,
  className = '' 
}: FarmingInterfaceProps) => {
  const [selectedTraining, setSelectedTraining] = useState<string>('general');
  const queryClient = useQueryClient();

  // Fetch farming status
  const { data: farmingStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['farming-status', ownedPlayerId],
    queryFn: () => ApiService.getFarmingStatus(ownedPlayerId),
    refetchInterval: 5000, // Check every 5 seconds
  });

  // Process farming session mutation
  const farmingMutation = useMutation({
    mutationFn: (farmingType: string) => ApiService.processFarmingSession(ownedPlayerId, farmingType),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['farming-status', ownedPlayerId] });
      queryClient.invalidateQueries({ queryKey: ['owned-players'] });
      queryClient.invalidateQueries({ queryKey: ['player-progression', ownedPlayerId] });
      
      // Show success message
      console.log('Farming session completed:', data);
    },
    onError: (error) => {
      console.error('Farming session failed:', error);
    },
  });

  const trainingTypes = [
    {
      id: 'general',
      name: 'General Training',
      description: 'Balanced improvement across all stats',
      icon: TrendingUp,
      color: 'from-football-green to-football-blue',
      cost: '$5.00',
      duration: '1 hour',
      xpGain: '25 XP'
    },
    {
      id: 'speed',
      name: 'Speed Training',
      description: 'Focus on improving speed and agility',
      icon: Zap,
      color: 'from-yellow-400 to-orange-500',
      cost: '$8.00',
      duration: '1 hour',
      xpGain: '30 XP'
    },
    {
      id: 'shooting',
      name: 'Shooting Practice',
      description: 'Enhance shooting accuracy and power',
      icon: Target,
      color: 'from-red-400 to-pink-500',
      cost: '$8.00',
      duration: '1 hour',
      xpGain: '30 XP'
    },
    {
      id: 'passing',
      name: 'Passing Drills',
      description: 'Improve passing precision and vision',
      icon: Users,
      color: 'from-blue-400 to-cyan-500',
      cost: '$8.00',
      duration: '1 hour',
      xpGain: '30 XP'
    },
    {
      id: 'defense',
      name: 'Defensive Training',
      description: 'Strengthen defensive positioning',
      icon: Shield,
      color: 'from-purple-400 to-pink-500',
      cost: '$8.00',
      duration: '1 hour',
      xpGain: '30 XP'
    },
    {
      id: 'goalkeeping',
      name: 'Goalkeeper Training',
      description: 'Enhance reflexes and positioning',
      icon: Star,
      color: 'from-green-400 to-emerald-500',
      cost: '$8.00',
      duration: '1 hour',
      xpGain: '30 XP'
    }
  ];

  const handleStartTraining = () => {
    farmingMutation.mutate(selectedTraining);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'text-green-400';
    if (progress >= 75) return 'text-blue-400';
    if (progress >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (statusLoading) {
    return (
      <div className={`glass-dark rounded-xl p-6 ${className}`}>
        <div className="flex justify-center items-center py-8">
          <LoadingSpinner text="Loading farming status..." />
        </div>
      </div>
    );
  }

  return (
    <div className={`glass-dark rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Player Training</h3>
        <div className="flex items-center space-x-2">
          {farmingStatus?.canPlay ? (
            <div className="flex items-center space-x-1 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Ready to Play</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-yellow-400">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Training Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Player Info */}
      <div className="mb-6 p-4 glass rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-semibold text-white">{playerName}</h4>
          <span className="text-sm text-gray-400">
            {division.charAt(0).toUpperCase() + division.slice(1)} División
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Level:</span>
            <span className="text-white font-semibold">{currentLevel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Experience:</span>
            <span className="text-white font-semibold">{experience.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Training Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Training Progress</span>
          <span className={`font-semibold ${getProgressColor(farmingStatus?.farmingProgress || 0)}`}>
            {farmingStatus?.farmingProgress || 0}%
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${farmingStatus?.farmingProgress || 0}%` }}
            transition={{ duration: 0.8 }}
            className={`h-3 rounded-full bg-gradient-to-r ${
              (farmingStatus?.farmingProgress || 0) >= 100 
                ? 'from-green-400 to-emerald-500'
                : 'from-football-green to-football-blue'
            }`}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>Training Required</span>
          <span>Ready to Play</span>
        </div>
      </div>

      {/* Requirements */}
      {farmingStatus?.requirements && (
        <div className="mb-6 p-4 glass rounded-lg">
          <h5 className="text-sm font-semibold text-white mb-3">Requirements to Play</h5>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Level:</span>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  {farmingStatus.requirements.level.current}/{farmingStatus.requirements.level.required}
                </span>
                {farmingStatus.requirements.level.met ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Experience:</span>
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm">
                  {farmingStatus.requirements.experience.current}/{farmingStatus.requirements.experience.required}
                </span>
                {farmingStatus.requirements.experience.met ? (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Options */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white mb-4">Training Options</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trainingTypes.map((training) => (
            <motion.button
              key={training.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTraining(training.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedTraining === training.id
                  ? 'border-football-green bg-football-green/10'
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-8 h-8 bg-gradient-to-r ${training.color} rounded-full flex items-center justify-center`}>
                  <training.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-white font-semibold text-sm">{training.name}</div>
                  <div className="text-gray-400 text-xs">{training.description}</div>
                </div>
              </div>
              
              <div className="flex justify-between text-xs text-gray-400">
                <span>{training.cost}</span>
                <span>{training.duration}</span>
                <span>{training.xpGain}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Start Training Button */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStartTraining}
          disabled={farmingMutation.isPending || farmingStatus?.canPlay}
          className="btn-primary flex items-center space-x-2 mx-auto disabled:opacity-50"
        >
          {farmingMutation.isPending ? (
            <LoadingSpinner size="sm" color="white" />
          ) : farmingStatus?.canPlay ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Player Ready!</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Start Training</span>
            </>
          )}
        </motion.button>
        
        {farmingStatus?.canPlay && (
          <p className="text-sm text-green-400 mt-2">
            Your player is ready to compete in penalty shootouts!
          </p>
        )}
        
        {farmingStatus?.reason && !farmingStatus.canPlay && (
          <p className="text-sm text-yellow-400 mt-2">
            {farmingStatus.reason}
          </p>
        )}
      </div>
    </div>
  );
};

export default FarmingInterface;