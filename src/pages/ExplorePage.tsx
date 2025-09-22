import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';
import { FilterOptions } from '../types';
import NFTGrid from '../components/nft/NFTGrid';

const ExplorePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'created',
    sortOrder: 'desc'
  });

  // Fetch NFTs with filters
  const { data: nfts, isLoading, error, refetch } = useQuery({
    queryKey: ['nfts', filters, searchQuery],
    queryFn: () => {
      // Mock implementation for now
      return Promise.resolve([]);
    }
  });

  // Search functionality
  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => {
      // Mock implementation for now
      return Promise.resolve({ nfts: [] });
    },
    enabled: searchQuery.length > 2
  });

  const categories = [
    'All',
    'Art',
    'Gaming',
    'Music',
    'Photography',
    'Sports',
    'Collectibles',
    'Virtual Worlds'
  ];

  const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
  const blockchains = ['Ethereum', 'Polygon', 'BSC', 'Solana'];

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRarityToggle = (rarity: string) => {
    const currentRarities = filters.rarity || [];
    const newRarities = currentRarities.includes(rarity)
      ? currentRarities.filter(r => r !== rarity)
      : [...currentRarities, rarity];
    
    handleFilterChange('rarity', newRarities);
  };

  const handleBlockchainToggle = (blockchain: string) => {
    const currentBlockchains = filters.blockchain || [];
    const newBlockchains = currentBlockchains.includes(blockchain)
      ? currentBlockchains.filter(b => b !== blockchain)
      : [...currentBlockchains, blockchain];
    
    handleFilterChange('blockchain', newBlockchains);
  };

  const clearFilters = () => {
    setFilters({
      sortBy: 'created',
      sortOrder: 'desc'
    });
    setSearchQuery('');
  };

  const displayNFTs = searchQuery.length > 2 ? searchResults?.nfts : nfts;

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
            Explore NFTs
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover unique digital assets from creators around the world
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search NFTs, collections, creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 glass rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-neon-blue"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex items-center glass rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-neon-blue text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-neon-blue text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
              
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-secondary flex items-center space-x-2 ${
                  showFilters ? 'bg-neon-blue/20 text-neon-blue' : ''
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleFilterChange('category', category === 'All' ? undefined : category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  (filters.category === category || (category === 'All' && !filters.category))
                    ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                    : 'glass text-gray-400 hover:text-white hover:bg-white/20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass rounded-xl p-6 mb-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Price Range (ETH)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.priceMin || ''}
                      onChange={(e) => handleFilterChange('priceMin', parseFloat(e.target.value) || undefined)}
                      className="flex-1 input-field text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.priceMax || ''}
                      onChange={(e) => handleFilterChange('priceMax', parseFloat(e.target.value) || undefined)}
                      className="flex-1 input-field text-sm"
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Sort By
                  </label>
                  <select
                    value={filters.sortBy || 'created'}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full input-field text-sm"
                  >
                    <option value="created">Recently Created</option>
                    <option value="price">Price</option>
                    <option value="likes">Most Liked</option>
                    <option value="views">Most Viewed</option>
                  </select>
                </div>

                {/* Sort Order */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Order
                  </label>
                  <select
                    value={filters.sortOrder || 'desc'}
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
                    className="w-full input-field text-sm"
                  >
                    <option value="desc">High to Low</option>
                    <option value="asc">Low to High</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full btn-outline text-sm"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Rarity Filter */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Rarity
                </label>
                <div className="flex flex-wrap gap-2">
                  {rarities.map((rarity) => (
                    <button
                      key={rarity}
                      onClick={() => handleRarityToggle(rarity)}
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                        filters.rarity?.includes(rarity)
                          ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                          : 'glass text-gray-400 hover:text-white'
                      }`}
                    >
                      {rarity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Blockchain Filter */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-white mb-2">
                  Blockchain
                </label>
                <div className="flex flex-wrap gap-2">
                  {blockchains.map((blockchain) => (
                    <button
                      key={blockchain}
                      onClick={() => handleBlockchainToggle(blockchain)}
                      className={`px-3 py-1 rounded-full text-sm transition-all duration-300 ${
                        filters.blockchain?.includes(blockchain)
                          ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                          : 'glass text-gray-400 hover:text-white'
                      }`}
                    >
                      {blockchain}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-gray-400">
              {displayNFTs && (
                <span>
                  {displayNFTs.length} NFT{displayNFTs.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </span>
              )}
            </div>
          </div>

          {/* NFT Grid */}
          <NFTGrid
            nfts={displayNFTs || []}
            loading={isLoading}
            error={error?.message}
            columns={viewMode === 'grid' ? 4 : 2}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ExplorePage;