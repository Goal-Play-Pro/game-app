import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List } from 'lucide-react';
import { REAL_PLAYERS_DATA, RealPlayersService } from '../../data/players.data';
import PlayerCard from './PlayerCard';

interface PlayersGalleryProps {
  division?: string;
  onPlayerSelect?: (playerName: string) => void;
  selectedPlayer?: string;
  className?: string;
}

const PlayersGallery = ({ 
  division = 'primera', 
  onPlayerSelect, 
  selectedPlayer,
  className = '' 
}: PlayersGalleryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get players for current division
  const divisionPlayers = REAL_PLAYERS_DATA.filter(player => {
    const divisionMap = {
      'primera': 'First',
      'segunda': 'Second', 
      'tercera': 'Third'
    };
    
    const targetDivision = divisionMap[division.toLowerCase()] || division;
    return player.divisions.includes(targetDivision);
  });

  // Apply filters
  const filteredPlayers = divisionPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    const matchesRarity = rarityFilter === 'all' || player.rarity === rarityFilter;
    
    return matchesSearch && matchesPosition && matchesRarity;
  });

  const positions = ['all', 'goalkeeper', 'defender', 'midfielder', 'forward'];
  const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
    : 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">
          {division.charAt(0).toUpperCase() + division.slice(1)} División Players
        </h3>
        <div className="text-sm text-gray-400">
          {filteredPlayers.length} of {divisionPlayers.length} players
        </div>
      </div>

      {/* Filters */}
      <div className="glass-dark rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 input-field text-sm"
            />
          </div>

          {/* Position Filter */}
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="input-field text-sm"
          >
            {positions.map(position => (
              <option key={position} value={position}>
                {position === 'all' ? 'All Positions' : position.charAt(0).toUpperCase() + position.slice(1)}
              </option>
            ))}
          </select>

          {/* Rarity Filter */}
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value)}
            className="input-field text-sm"
          >
            {rarities.map(rarity => (
              <option key={rarity} value={rarity}>
                {rarity === 'all' ? 'All Rarities' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
              </option>
            ))}
          </select>

          {/* View Mode */}
          <div className="flex items-center glass rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-football-green text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' 
                  ? 'bg-football-green text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Players Grid */}
      <div className={gridClasses}>
        {filteredPlayers.map((player, index) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PlayerCard
              player={player}
              division={division}
              isSelected={selectedPlayer === player.name}
              onSelect={() => onPlayerSelect?.(player.name)}
              showStats={true}
            />
          </motion.div>
        ))}
      </div>

      {/* No Results */}
      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-500" />
          </div>
          <h4 className="text-lg font-semibold text-white mb-2">No Players Found</h4>
          <p className="text-gray-400">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="glass-dark rounded-xl p-4">
        <h4 className="text-lg font-semibold text-white mb-4">Division Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-white font-semibold">{divisionPlayers.length}</div>
            <div className="text-gray-400">Total Players</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">
              {divisionPlayers.filter(p => p.rarity === 'legendary').length}
            </div>
            <div className="text-gray-400">Legendary</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">
              {divisionPlayers.filter(p => p.position === 'forward').length}
            </div>
            <div className="text-gray-400">Forwards</div>
          </div>
          <div className="text-center">
            <div className="text-white font-semibold">
              {divisionPlayers.filter(p => p.position === 'goalkeeper').length}
            </div>
            <div className="text-gray-400">Goalkeepers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayersGallery;