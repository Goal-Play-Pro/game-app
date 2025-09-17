import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Volume2, Users, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import CollectionCard from '../components/collections/CollectionCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

const CollectionsPage = () => {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [sortBy, setSortBy] = useState<'volume' | 'floor' | 'owners' | 'created'>('volume');

  // Fetch collections
  const { data: collections, isLoading, error } = useQuery({
    queryKey: ['collections', timeframe, sortBy],
    queryFn: () => api.getCollections()
  });

  const timeframes = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'all', label: 'All Time' }
  ];

  const sortOptions = [
    { value: 'volume', label: 'Volume', icon: Volume2 },
    { value: 'floor', label: 'Floor Price', icon: TrendingUp },
    { value: 'owners', label: 'Owners', icon: Users },
    { value: 'created', label: 'Recently Created', icon: Clock }
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

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
            Top Collections
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover the most popular and trending NFT collections
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-6 mb-8"
        >
          {/* Timeframe Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm font-medium">Timeframe:</span>
            <div className="flex items-center glass rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value as any)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeframe === tf.value
                      ? 'bg-neon-blue text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-gray-400 text-sm font-medium">Sort by:</span>
            <div className="flex items-center glass rounded-lg p-1">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    sortBy === option.value
                      ? 'bg-neon-blue text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Collections Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" text="Loading collections..." />
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="glass-dark rounded-xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-2xl">⚠</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Something went wrong
                </h3>
                <p className="text-gray-400 mb-6">
                  Failed to load collections. Please try again.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : collections && collections.length > 0 ? (
            <>
              {/* Top 3 Collections - Featured */}
              <div className="mb-12">
                <h2 className="text-2xl font-display font-bold text-white mb-6">
                  🏆 Top Performers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {collections.slice(0, 3).map((collection, index) => (
                    <motion.div
                      key={collection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative"
                    >
                      {/* Rank Badge */}
                      <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm z-10 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                        'bg-gradient-to-r from-orange-400 to-red-500'
                      }`}>
                        {index + 1}
                      </div>
                      <CollectionCard collection={collection} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* All Collections - Ranked List */}
              <div>
                <h2 className="text-2xl font-display font-bold text-white mb-6">
                  📊 All Collections
                </h2>
                
                {/* Table Header */}
                <div className="glass rounded-xl p-4 mb-4 hidden lg:block">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Collection</div>
                    <div className="col-span-2">Floor Price</div>
                    <div className="col-span-2">Volume</div>
                    <div className="col-span-2">Owners</div>
                    <div className="col-span-1">Items</div>
                  </div>
                </div>

                {/* Collections List */}
                <div className="space-y-4">
                  {Array.isArray(collections) && collections.map((collection, index) => (
                    <motion.div
                      key={collection.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-xl p-4 hover:bg-white/10 transition-colors group"
                    >
                      {/* Desktop Layout */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1">
                          <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {index + 1}
                          </div>
                        </div>
                        
                        <div className="col-span-4 flex items-center space-x-4">
                          <img
                            src={collection.image}
                            alt={collection.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-white group-hover:text-neon-blue transition-colors">
                                {collection.name}
                              </h3>
                              {collection.isVerified && (
                                <div className="w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs">✓</span>
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              by {collection.creator.displayName}
                            </p>
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="font-semibold text-white">
                            {collection.floorPrice} ETH
                          </div>
                          <div className="text-sm text-green-400">
                            +5.2%
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="font-semibold text-white">
                            {formatNumber(collection.totalVolume)} ETH
                          </div>
                          <div className="text-sm text-green-400">
                            +12.8%
                          </div>
                        </div>
                        
                        <div className="col-span-2">
                          <div className="font-semibold text-white">
                            {formatNumber(collection.ownersCount)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {((collection.ownersCount / collection.totalSupply) * 100).toFixed(1)}%
                          </div>
                        </div>
                        
                        <div className="col-span-1">
                          <div className="font-semibold text-white">
                            {formatNumber(collection.totalSupply)}
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="lg:hidden">
                        <CollectionCard collection={collection} rank={index + 1} showRank />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="glass-dark rounded-xl p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-500 text-2xl">📁</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No collections found
                </h3>
                <p className="text-gray-400">
                  Collections will appear here once they're available
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CollectionsPage;