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
import { api } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NFTDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'offers'>('details');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Fetch NFT details
  const { data: nft, isLoading, error } = useQuery({
    queryKey: ['nft', id],
    queryFn: () => api.getNFTById(id!),
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
      await api.likeNFT(nft.id);
      // Refetch or update local state
    } catch (error) {
      console.error('Error liking NFT:', error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: nft.name,
        text: nft.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleBuy = async () => {
    try {
      const success = await api.buyNFT(nft.id);
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
                <div className="text-sm text-gray-400">Likes</div>
              </div>
              
              <div className="glass rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-lg font-semibold text-white">{nft.views}</div>
                <div className="text-sm text-gray-400">Views</div>
              </div>
              
              <div className="glass rounded-xl p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-lg font-semibold text-white">#{Math.floor(Math.random() * 100) + 1}</div>
                <div className="text-sm text-gray-400">Rank</div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Collection Info */}
            <div className="flex items-center space-x-3">
              <img
                src={nft.collection.image}
                alt={nft.collection.name}
                className="w-8 h-8 rounded-full"
              />
              <Link
                to={`/collection/${nft.collection.id}`}
                className="text-neon-blue hover:text-neon-purple transition-colors font-medium"
              >
                {nft.collection.name}
              </Link>
              {nft.collection.isVerified && (
                <div className="w-5 h-5 bg-neon-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-display font-bold text-white">
              {nft.name}
            </h1>

            {/* Creator & Owner */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-2">Created by</div>
                <div className="flex items-center space-x-2">
                  <img
                    src={nft.creator.avatar}
                    alt={nft.creator.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                  <Link
                    to={`/profile/${nft.creator.id}`}
                    className="text-white hover:text-neon-blue transition-colors font-medium"
                  >
                    {nft.creator.displayName}
                  </Link>
                  {nft.creator.isVerified && (
                    <div className="w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-400 mb-2">Owned by</div>
                <div className="flex items-center space-x-2">
                  <img
                    src={nft.owner.avatar}
                    alt={nft.owner.displayName}
                    className="w-8 h-8 rounded-full"
                  />
                  <Link
                    to={`/profile/${nft.owner.id}`}
                    className="text-white hover:text-neon-blue transition-colors font-medium"
                  >
                    {nft.owner.displayName}
                  </Link>
                  {nft.owner.isVerified && (
                    <div className="w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
              <p className={`text-gray-300 leading-relaxed ${!showFullDescription && nft.description.length > 200 ? 'line-clamp-3' : ''}`}>
                {nft.description}
              </p>
              {nft.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-neon-blue hover:text-neon-purple transition-colors text-sm mt-2"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Price & Actions */}
            {nft.isForSale && (
              <div className="glass rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Current Price</div>
                    <div className="text-3xl font-bold text-white">
                      {nft.price} {nft.currency}
                    </div>
                    <div className="text-sm text-gray-400">
                      ≈ ${(nft.price * 2000).toLocaleString()} USD
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Ends in</div>
                    <div className="text-lg font-semibold text-white">
                      2d 14h 32m
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBuy}
                    className="flex-1 btn-primary flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Buy Now</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 btn-outline flex items-center justify-center space-x-2"
                  >
                    <Zap className="w-5 h-5" />
                    <span>Make Offer</span>
                  </motion.button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="glass rounded-xl overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-white/10">
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'activity', label: 'Activity' },
                  { id: 'offers', label: 'Offers' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-neon-blue border-b-2 border-neon-blue'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Attributes */}
                    {nft.attributes.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Attributes</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {nft.attributes.map((attr, index) => (
                            <div key={index} className="glass rounded-lg p-3 text-center">
                              <div className="text-sm text-gray-400 mb-1">
                                {attr.trait_type}
                              </div>
                              <div className="font-semibold text-white">
                                {attr.value}
                              </div>
                              {attr.rarity && (
                                <div className="text-xs text-neon-blue mt-1">
                                  {attr.rarity}% rare
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Blockchain Info */}
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Blockchain Info</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Blockchain</span>
                          <span className="text-white">{nft.blockchain}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Token Standard</span>
                          <span className="text-white">ERC-721</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Contract Address</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white">0x742d...Be000</span>
                            <button className="text-gray-400 hover:text-white transition-colors">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Token ID</span>
                          <span className="text-white">{nft.id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">
                      No Activity Yet
                    </h4>
                    <p className="text-gray-400">
                      Activity will appear here once there are sales, transfers, or other events.
                    </p>
                  </div>
                )}

                {activeTab === 'offers' && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">
                      No Offers Yet
                    </h4>
                    <p className="text-gray-400">
                      Be the first to make an offer on this NFT!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default NFTDetailPage;