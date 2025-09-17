import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Eye } from 'lucide-react';
import { Collection } from '../../types';

interface CollectionCardProps {
  collection: Collection;
  rank?: number;
  showRank?: boolean;
}

const CollectionCard = ({ collection, rank, showRank = false }: CollectionCardProps) => {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="group"
    >
      <Link to={`/collection/${collection.id}`}>
        <div className="cyber-card overflow-hidden">
          {/* Banner Image */}
          <div className="relative h-32 overflow-hidden rounded-lg mb-4">
            <img
              src={collection.banner}
              alt={collection.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Rank Badge */}
            {showRank && rank && (
              <div className="absolute top-3 left-3 w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full flex items-center justify-center text-white font-bold text-sm">
                {rank}
              </div>
            )}
            
            {/* Verified Badge */}
            {collection.isVerified && (
              <div className="absolute top-3 right-3 w-6 h-6 bg-neon-blue rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
          
          {/* Collection Avatar */}
          <div className="flex items-start space-x-4 mb-4">
            <div className="relative">
              <img
                src={collection.image}
                alt={collection.name}
                className="w-16 h-16 rounded-full border-2 border-white/20"
              />
              {collection.isVerified && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-lg group-hover:text-neon-blue transition-colors truncate">
                {collection.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <img
                  src={collection.creator.avatar}
                  alt={collection.creator.displayName}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm text-gray-400 truncate">
                  by {collection.creator.displayName}
                </span>
                {collection.creator.isVerified && (
                  <div className="w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Description */}
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
            {collection.description}
          </p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {collection.floorPrice} ETH
              </div>
              <div className="text-xs text-gray-400">Floor Price</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold text-white">
                {formatNumber(collection.totalVolume)} ETH
              </div>
              <div className="text-xs text-gray-400">Total Volume</div>
            </div>
          </div>
          
          {/* Additional Stats */}
          <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-white/10">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{formatNumber(collection.ownersCount)}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400">+12.5%</span>
            </div>
            
            <div className="text-xs">
              {formatNumber(collection.totalSupply)} items
            </div>
          </div>
          
          {/* Blockchain Badge */}
          <div className="mt-3 flex justify-between items-center">
            <div className="px-2 py-1 bg-gradient-to-r from-neon-blue/20 to-neon-purple/20 rounded-full text-xs text-neon-blue border border-neon-blue/30">
              {collection.blockchain}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Handle view collection
              }}
              className="px-3 py-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full text-white text-xs font-semibold hover:from-neon-purple hover:to-neon-pink transition-all duration-300"
            >
              View Collection
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CollectionCard;