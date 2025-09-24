import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Heart, 
  Share2, 
  ExternalLink, 
  Eye, 
  Clock, 
  ShoppingCart,
  Zap,
  MoreHorizontal,
  TrendingUp,
  Users
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

import { shareContent } from '../utils/share.utils';

const NFTDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'offers'>('details');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Fetch NFT details
  const { data: nft, isLoading, error } = useQuery({
    queryKey: ['nft', id],
    queryFn: () => {
      // Mock implementation for now
      return Promise.resolve(null);
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading NFT..." />
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <div className="glass-dark rounded-xl p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            NFT Not Found
          </h3>
          <p className="text-gray-400 mb-6">
            The NFT you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/explore" className="btn-primary">
            Explore NFTs
          </Link>
        </div>
      </div>
    );
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-pink-500';
      case 'rare': return 'from-blue-400 to-cyan-500';
      case 'uncommon': return 'from-green-400 to-emerald-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const handleLike = async () => {
    try {
      // Mock implementation for now
      console.log('Like NFT:', nft?.id);
      // Refetch or update local state
    } catch (error) {
      console.error('Error liking NFT:', error);
    }
  };

  const handleShare = () => {
    // Usar utilidad robusta de compartir
    shareContent({
      title: nft.name,
      text: nft.description,
      url: window.location.href
    }, {
      showNotification: true,
      fallbackToPrompt: true
    }).then((result) => {
      if (result.success) {
        console.log(`✅ NFT detail shared via ${result.method}`);
      }
    });
  };

  const handleBuy = async () => {
    try {
      // Mock implementation for now
      const success = true;
      if (success) {
        // Handle successful purchase
        alert('Purchase successful!');
      }
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl glass">
              <img
                src={nft.image}
                alt={nft.name}
                className="w-full h-full object-cover"
              />
              
              {/* Rarity Badge */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${getRarityColor(nft.rarity)}`}>
                {nft.rarity}
              </div>
              
              {/* Quick Actions */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className={`p-3 rounded-full backdrop-blur-md transition-colors ${
                    nft.isLiked 
                      ? 'bg-red-500/80 text-white' 
                      : 'bg-black/40 text-white hover:bg-red-500/80'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${nft.isLiked ? 'fill-current' : ''}`} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleShare}
                  className="p-3 rounded-full bg-black/40 text-white hover:bg-neon-blue/80 backdrop-blur-md transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-3 rounded-full bg-black/40 text-white hover:bg-neon-blue/80 backdrop-blur-md transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </motion.button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Heart className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-lg font-semibold text-white">{nft.likes}</div>
  )
}