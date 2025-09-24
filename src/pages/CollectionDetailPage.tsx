import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ExternalLink, 
  Share2, 
  Heart, 
  TrendingUp, 
  Users, 
  Eye,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';
import NFTGrid from '../components/nft/NFTGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';

import { shareContent } from '../utils/share.utils';

const CollectionDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'price' | 'created' | 'likes' | 'views'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch collection details
  const { data: collection, isLoading: collectionLoading, error: collectionError } = useQuery({
    queryKey: ['collection', id],
    queryFn: () => {
      // Mock implementation for now
      return Promise.resolve(null);
    },
    enabled: !!id
  });

  // Fetch collection NFTs
  const { data: nfts, isLoading: nftsLoading } = useQuery({
    queryKey: ['collection-nfts', id, sortBy, sortOrder],
    queryFn: () => {
      // Mock implementation for now
      return Promise.resolve([]);
    },
    enabled: !!id
  });

  if (collectionLoading) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading collection..." />
      </div>
    );
  }

  if (collectionError || !collection) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <div className="glass-dark rounded-xl p-8 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Collection Not Found
          </h3>
          <p className="text-gray-400 mb-6">
            The collection you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/collections" className="btn-primary">
            Browse Collections
          </Link>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleShare = () => {
    // Usar utilidad robusta de compartir
    shareContent({
      title: collection.name,
      text: collection.description,
      url: window.location.href
    }, {
      showNotification: true,
      fallbackToPrompt: true
    }).then((result) => {
      if (result.success) {
        console.log(`✅ Collection shared via ${result.method}`);
      }
    });
  };

  return (
    <div className="pt-16 pb-20">
      {/* Banner */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        <img
          src={collection.banner}
          alt={collection.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Collection Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative -mt-20 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-end space-y-4 md:space-y-0 md:space-x-6">
            {/* Collection Avatar */}
            <div className="relative">
              <img
                src={collection.image}
                alt={collection.name}
                className="w-32 h-32 rounded-full border-4 border-white/20 glass"
              />
              {collection.isVerified && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-neon-blue rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✓</span>
                </div>
              )}
            </div>

            {/* Collection Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2">
                    {collection.name}
                  </h1>
                  
                  {/* Creator */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-gray-400">Created by</span>
                    <img
                      src={collection.creator.avatar}
                      alt={collection.creator.displayName}
                      className="w-6 h-6 rounded-full"
                    />
                    <Link
                      to={`/profile/${collection.creator.id}`}
                      className="text-neon-blue hover:text-neon-purple transition-colors font-medium"
                    >
                      {collection.creator.displayName}
                    </Link>
                    {collection.creator.isVerified && (
                      <div className="w-4 h-4 bg-neon-blue rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3">
                  <button className="btn-secondary flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Follow</span>
                  </button>
                  
                  <button
                    onClick={handleShare}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  {collection.socialLinks?.website && (
                    <a
                      href={collection.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center space-x-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Website</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-300 mt-4 max-w-3xl">
            {collection.description}
          </p>

          {/* Social Links */}
          {collection.socialLinks && (
            <div className="flex items-center space-x-4 mt-4">
              {collection.socialLinks.website && (
                <a
                  href={collection.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-blue hover:text-neon-purple transition-colors"
                >
                  Website
                </a>
              )}
              {collection.socialLinks.discord && (
                <a
                  href={collection.socialLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-blue hover:text-neon-purple transition-colors"
                >
                  Discord
                </a>
              )}
              {collection.socialLinks.twitter && (
                <a
                  href={collection.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-blue hover:text-neon-purple transition-colors"
                >
                  Twitter
                </a>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CollectionDetailPage;