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
import LoadingSpinner from '../components/common/LoadingSpinner';

import { shareContent } from '../utils/share.utils';

interface NftDetail {
  id: string;
  name: string;
  image: string;
  rarity: string;
  isLiked: boolean;
  likes: number;
  views: number;
  owners: number;
  tokenId: string;
  price: string;
  description: string;
  collection: string;
  mintedAt: string;
  creator: {
    name: string;
    avatar: string;
  };
}

const NFTDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'details' | 'activity' | 'offers'>('details');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Fetch NFT details
  const { data: nft, isLoading, error } = useQuery<NftDetail | null>({
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
    if (!nft) {
      return;
    }
    try {
      // Mock implementation for now
      console.log('Like NFT:', nft?.id);
      // Refetch or update local state
    } catch (error) {
      console.error('Error liking NFT:', error);
    }
  };

  const handleShare = () => {
    if (!nft) {
      return;
    }
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
    if (!nft) {
      return;
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2 space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-black/20">
                <img
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold text-white bg-gradient-to-r ${getRarityColor(nft.rarity)}`}
                >
                  {nft.rarity}
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
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
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleShare}
                    className="p-3 rounded-full bg-black/40 text-white hover:bg-neon-blue/80 backdrop-blur-md transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="glass rounded-xl p-4 text-center space-y-1">
                  <Heart className="w-5 h-5 mx-auto text-red-400" />
                  <span className="text-lg font-semibold text-white">{nft.likes}</span>
                  <p className="text-xs text-gray-400">Likes</p>
                </div>
                <div className="glass rounded-xl p-4 text-center space-y-1">
                  <Eye className="w-5 h-5 mx-auto text-blue-400" />
                  <span className="text-lg font-semibold text-white">{nft.views}</span>
                  <p className="text-xs text-gray-400">Views</p>
                </div>
                <div className="glass rounded-xl p-4 text-center space-y-1">
                  <Users className="w-5 h-5 mx-auto text-green-400" />
                  <span className="text-lg font-semibold text-white">{nft.owners}</span>
                  <p className="text-xs text-gray-400">Owners</p>
                </div>
              </div>
            </div>

            <div className="lg:w-1/2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{nft.name}</h1>
                <p className="text-sm text-gray-400">Token ID: {nft.tokenId}</p>
              </div>

              <div className="glass rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Current Price</span>
                  <span className="text-2xl font-semibold text-white flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-yellow-400" />
                    <span>{nft.price}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleBuy}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Buy Now</span>
                </button>
              </div>

              <div className="glass rounded-xl p-5 space-y-3">
                <h2 className="text-lg font-semibold text-white">Description</h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {showFullDescription ? nft.description : `${nft.description.slice(0, 180)}...`}
                </p>
                <button
                  type="button"
                  onClick={() => setShowFullDescription((value) => !value)}
                  className="text-neon-blue text-sm font-semibold hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              </div>

              <div className="glass rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Creator</span>
                  <span className="flex items-center space-x-2">
                    <img
                      src={nft.creator.avatar}
                      alt={nft.creator.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <span>{nft.creator.name}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Minted</span>
                  <span className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{nft.mintedAt}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-300">
                  <span>Collection</span>
                  <span className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>{nft.collection}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NFTDetailPage;
