import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, Share2, ShoppingCart, Zap } from 'lucide-react';
import { NFT } from '../../types';
import ApiService from '../../services/api';

interface NFTCardProps {
  nft: NFT;
  showCollection?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

import { shareContent } from '../../utils/share.utils';

const NFTCard = ({ nft, showCollection = true, size = 'md' }: NFTCardProps) => {
  const [isLiked, setIsLiked] = useState(nft.isLiked);
  const [likes, setLikes] = useState(nft.likes);
  const [isLoading, setIsLoading] = useState(false);

  const sizeClasses = {
    sm: 'w-full max-w-xs',
    md: 'w-full max-w-sm',
    lg: 'w-full max-w-md'
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);
    try {
      // Mock implementation for now
      console.log('Like NFT:', nft.id);
      setIsLiked(!isLiked);
      setLikes(prev => isLiked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error liking NFT:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Usar utilidad robusta de compartir
    shareContent({
      title: nft.name,
      text: nft.description,
      url: window.location.origin + `/nft/${nft.id}`
    }, {
      showNotification: true,
      fallbackToPrompt: false
    }).then((result) => {
      if (result.success) {
        console.log(`✅ NFT shared via ${result.method}`);
      }
    });
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className={`${sizeClasses[size]} group`}
    >
      <Link to={`/nft/${nft.id}`}>
        <div className="cyber-card overflow-hidden">
          {/* Image Container */}
          <div className="relative aspect-square overflow-hidden rounded-lg mb-4">
            <img
              src={nft.image}
              alt={nft.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Rarity Badge */}
            <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getRarityColor(nft.rarity)}`}>
              {nft.rarity}
            </div>
            
            {/* Quick Actions */}
            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                disabled={isLoading}
                className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                  isLiked 
                    ? 'bg-red-500/80 text-white' 
                    : 'bg-black/40 text-white hover:bg-red-500/80'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="p-2 rounded-full bg-black/40 text-white hover:bg-neon-blue/80 backdrop-blur-md transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </motion.button>
            </div>
            
            {/* Price Badge */}
            {nft.isForSale && (
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-sm font-semibold">
                {nft.price} {nft.currency}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="space-y-3">
            {/* Collection */}
            {showCollection && (
              <div className="flex items-center space-x-2">
                <img
                  src={nft.collection.image}
                  alt={nft.collection.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-sm text-gray-400">{nft.collection.name}</span>
                {nft.collection.isVerified && (
                  <div className="w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Title */}
            <h3 className="font-semibold text-white text-lg group-hover:text-neon-blue transition-colors">
              {nft.name}
            </h3>
            
            {/* Creator */}
            <div className="flex items-center space-x-2">
              <img
                src={nft.creator.avatar}
                alt={nft.creator.displayName}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-sm text-gray-400">
                by {nft.creator.displayName}
              </span>
              {nft.creator.isVerified && (
                <div className="w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{nft.views}</span>
                </div>
              </div>
              
              {nft.isForSale && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Handle buy action
                  }}
                  className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-neon-blue to-neon-purple rounded-full text-white text-xs font-semibold hover:from-neon-purple hover:to-neon-pink transition-all duration-300"
                >
                  <ShoppingCart className="w-3 h-3" />
                  <span>Buy</span>
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default NFTCard;