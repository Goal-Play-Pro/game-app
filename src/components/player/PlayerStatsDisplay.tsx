import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Zap, 
  Target, 
  Shield, 
  Users,
  BarChart3,
  Info,
  Star
} from 'lucide-react';
import { PlayerStats } from '../../types';
import ApiService from '../../services/api';

interface PlayerStatsDisplayProps {
  playerStats: PlayerStats;
  division: string;
  currentLevel: number;
  experience: number;
  showProbability?: boolean;
  showProgression?: boolean;
  className?: string;
}

const PlayerStatsDisplay = ({ 
  playerStats, 
  division, 
  currentLevel, 
  experience,
  showProbability = true,
  showProgression = true,
  className = '' 
}: PlayerStatsDisplayProps) => {
  const [penaltyChance, setPenaltyChance] = useState<number | null>(null);

  // Calculate penalty chance using the canonical formula
  useEffect(() => {
    const calculateChance = async () => {
      try {
        const chance = await ApiService.calculatePenaltyChance(playerStats, division);
        setPenaltyChance(chance);
      } catch (error) {
        console.warn('Could not calculate penalty chance');
        // Fallback calculation
        const totalStats = playerStats.speed + playerStats.shooting + playerStats.passing + 
                          playerStats.defending + playerStats.goalkeeping;
        
        const divisionRanges = {
          primera: { min: 95, max: 171, minChance: 50, maxChance: 90 },
          segunda: { min: 76, max: 152, minChance: 40, maxChance: 80 },
          tercera: { min: 57, max: 133, minChance: 30, maxChance: 70 }
        };
        
        const range = divisionRanges[division.toLowerCase() as keyof typeof divisionRanges] || divisionRanges.tercera;
        const ratio = Math.max(0, Math.min(1, (totalStats - range.min) / (range.max - range.min)));
        const chance = range.minChance + (range.maxChance - range.minChance) * ratio;
        
        setPenaltyChance(Math.floor(Math.max(5, Math.min(95, chance))));
      }
    };
    calculateChance();
  }, [playerStats, division]);

  const getStatIcon = (statName: string) => {
    switch (statName) {
      case 'speed': return <Zap className="w-4 h-4" />;
      case 'shooting': return <Target className="w-4 h-4" />;
      case 'passing': return <Users className="w-4 h-4" />;
      case 'defending': return <Shield className="w-4 h-4" />;
      case 'goalkeeping': return <Star className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getStatColor = (value: number, maxValue: number) => {
    const percentage = (value / maxValue) * 100;
    if (percentage >= 80) return 'from-green-400 to-emerald-500';
    if (percentage >= 60) return 'from-blue-400 to-cyan-500';
    if (percentage >= 40) return 'from-yellow-400 to-orange-500';
    return 'from-red-400 to-pink-500';
  };

  const getDivisionColor = (division: string) => {
    switch (division.toLowerCase()) {
      case 'primera': return 'text-yellow-400';
      case 'segunda': return 'text-blue-400';
      case 'tercera': return 'text-gray-400';
      default: return 'text-white';
    }
  };

  // Division configuration
  const divisionConfig = {
    primera: { startingStats: 95, maxStats: 171, startingPercentage: 50, maxPercentage: 90 },
    segunda: { startingStats: 76, maxStats: 152, startingPercentage: 40, maxPercentage: 80 },
    tercera: { startingStats: 57, maxStats: 133, startingPercentage: 30, maxPercentage: 70 }
  };

  const currentDivisionConfig = divisionConfig[division.toLowerCase() as keyof typeof divisionConfig] || divisionConfig.tercera;
  const totalStats = playerStats.speed + playerStats.shooting + playerStats.passing + 
                    playerStats.defending + playerStats.goalkeeping;

  return (
    <div className={`glass-dark rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Player Statistics</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${getDivisionColor(division)}`}>
            {division.charAt(0).toUpperCase() + division.slice(1)} División
          </span>
          <div className="w-2 h-2 bg-green-400 rounded-full" />
        </div>
      </div>

      {/* Stats Breakdown */}
      <div className="space-y-4 mb-6">
        {Object.entries(playerStats).map(([statName, value]) => {
          if (statName === 'overall') return null; // Skip overall for individual display
          
          const maxStatValue = Math.floor(currentDivisionConfig.maxStats / 5); // Rough max per stat
          const percentage = Math.min((value / maxStatValue) * 100, 100);
          
          return (
            <div key={statName} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatIcon(statName)}
                  <span className="text-gray-300 capitalize">{statName}:</span>
                </div>
                <span className="text-white font-semibold">{value}</span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className={`h-2 rounded-full bg-gradient-to-r ${getStatColor(value, maxStatValue)}`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total Stats Summary */}
      <div className="border-t border-white/10 pt-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Total Stats:</span>
          <span className="text-white font-bold text-lg">{totalStats}</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Division Range:</span>
          <span className="text-gray-300">
            {currentDivisionConfig.startingStats} - {currentDivisionConfig.maxStats}
          </span>
        </div>

        <div className="w-full bg-gray-700 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ 
              width: `${((totalStats - currentDivisionConfig.startingStats) / 
                       (currentDivisionConfig.maxStats - currentDivisionConfig.startingStats)) * 100}%` 
            }}
            transition={{ duration: 1 }}
            className="h-3 rounded-full bg-gradient-to-r from-football-green to-football-blue"
          />
        </div>
      </div>

      {/* Penalty Probability */}
      {showProbability && (
        <div className="border-t border-white/10 pt-4 mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Target className="w-5 h-5 text-football-green" />
            <h4 className="text-lg font-semibold text-white">Goal Probability</h4>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-football-green mb-2">
              {penaltyChance || Math.floor(currentDivisionConfig.startingPercentage + 
                ((totalStats - currentDivisionConfig.startingStats) / 
                 (currentDivisionConfig.maxStats - currentDivisionConfig.startingStats)) * 
                (currentDivisionConfig.maxPercentage - currentDivisionConfig.startingPercentage))}%
            </div>
            <div className="text-sm text-gray-400 mb-4">
              Current chance to score a penalty
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Division Min</div>
                <div className="text-white font-semibold">
                  {currentDivisionConfig.startingPercentage}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Division Max</div>
                <div className="text-white font-semibold">
                  {currentDivisionConfig.maxPercentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progression Info */}
      {showProgression && (
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-5 h-5 text-football-blue" />
            <h4 className="text-lg font-semibold text-white">Progression</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-football-blue mb-1">
                {currentLevel}
              </div>
              <div className="text-sm text-gray-400">Current Level</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-football-purple mb-1">
                {experience.toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Experience</div>
            </div>
          </div>

          <div className="mt-4 p-3 glass rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Info className="w-4 h-4 text-football-green" />
              <span className="text-sm font-semibold text-football-green">
                Progression Impact
              </span>
            </div>
            <p className="text-xs text-gray-400">
              As your player gains levels and experience, their stats increase and 
              penalty success rate improves within the division limits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStatsDisplay;