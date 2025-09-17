import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Target, Shield, Users, TrendingUp, Info } from 'lucide-react';
import { PlayerData } from '../../data/players.data';

interface PlayerCardProps {
  player: PlayerData;
  division: string;
  isSelected?: boolean;
  onSelect?: () => void;
  showStats?: boolean;
  className?: string;
}

const PlayerCard = ({ 
  player, 
  division, 
  isSelected = false, 
  onSelect, 
  showStats = false,
  className = '' 
}: PlayerCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getDivisionKey = (div: string) => {
    switch (div.toLowerCase()) {
      case 'primera': return 'first';
      case 'segunda': return 'second';
      case 'tercera': return 'third';
      default: return 'third';
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'uncommon': return 'from-green-400 to-emerald-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position.toLowerCase()) {
      case 'goalkeeper': return <Shield className="w-4 h-4" />;
      case 'defender': return <Shield className="w-4 h-4" />;
      case 'midfielder': return <Users className="w-4 h-4" />;
      case 'forward': return <Target className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'goalkeeper': return 'text-yellow-400';
      case 'defender': return 'text-blue-400';
      case 'midfielder': return 'text-green-400';
      case 'forward': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const divisionKey = getDivisionKey(division);
  const stats = player.statsByDivision[divisionKey];
  const totalStats = stats.speed + stats.shooting + stats.passing + stats.defense + stats.goalkeeping;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`game-card cursor-pointer relative overflow-hidden ${
        isSelected ? 'ring-2 ring-football-green' : ''
      } ${className}`}
    >
      {/* Rarity Badge */}
      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getRarityColor(player.rarity)}`}>
        {player.rarity.toUpperCase()}
      </div>

      {/* Position Badge */}
      <div className={`absolute top-3 left-3 p-1 rounded-full bg-black/40 ${getPositionColor(player.position)}`}>
        {getPositionIcon(player.position)}
      </div>

      {/* Player Image */}
      <div className="aspect-square rounded-lg overflow-hidden mb-4 relative">
        <img
          src={player.imageUrl}
          alt={player.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=400';
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Stats Button */}
        {showStats && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="absolute bottom-2 right-2 p-2 bg-black/60 text-white rounded-full hover:bg-football-green/80 transition-colors"
          >
            <Info className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {/* Player Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-football-green transition-colors">
          {player.name}
        </h3>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {getPositionIcon(player.position)}
            <span className={`capitalize ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
          </div>
          
          <div className="text-gray-400">
            Total: {totalStats}
          </div>
        </div>

        {/* Quick Stats Preview */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Speed:</span>
            <span className="text-white">{stats.speed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Shooting:</span>
            <span className="text-white">{stats.shooting}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Passing:</span>
            <span className="text-white">{stats.passing}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Defense:</span>
            <span className="text-white">{stats.defense}</span>
          </div>
        </div>
      </div>

      {/* Detailed Stats Modal */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/95 rounded-lg p-4 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center text-white space-y-3">
            <h4 className="font-bold text-lg">{player.name}</h4>
            <p className="text-sm text-gray-300 capitalize">{player.position} • {player.rarity}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Speed:</span>
                <span className="font-semibold">{stats.speed}</span>
              </div>
              <div className="flex justify-between">
                <span>Shooting:</span>
                <span className="font-semibold">{stats.shooting}</span>
              </div>
              <div className="flex justify-between">
                <span>Passing:</span>
                <span className="font-semibold">{stats.passing}</span>
              </div>
              <div className="flex justify-between">
                <span>Defense:</span>
                <span className="font-semibold">{stats.defense}</span>
              </div>
              <div className="flex justify-between">
                <span>Goalkeeping:</span>
                <span className="font-semibold">{stats.goalkeeping}</span>
              </div>
              <div className="border-t border-white/20 pt-2 flex justify-between">
                <span className="text-football-green">Total:</span>
                <span className="font-bold text-football-green">{totalStats}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowDetails(false)}
              className="btn-secondary text-sm mt-4"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PlayerCard;