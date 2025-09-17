import { motion } from 'framer-motion';
import { NFT } from '../../types';
import NFTCard from './NFTCard';
import LoadingSpinner from '../common/LoadingSpinner';

interface NFTGridProps {
  nfts: NFT[];
  loading?: boolean;
  error?: string;
  showCollection?: boolean;
  columns?: 2 | 3 | 4;
}

const NFTGrid = ({ 
  nfts, 
  loading = false, 
  error, 
  showCollection = true,
  columns = 4 
}: NFTGridProps) => {
  const gridClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" text="Loading NFTs..." />
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="glass-dark rounded-xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Something went wrong
          </h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </motion.div>
    );
  }

  if (nfts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="glass-dark rounded-xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-gray-500 text-2xl">🎨</span>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            No NFTs found
          </h3>
          <p className="text-gray-400 mb-6">
            Try adjusting your filters or search terms
          </p>
          <button className="btn-outline">
            Clear Filters
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`grid ${gridClasses[columns]} gap-6`}
    >
      {nfts.map((nft, index) => (
        <motion.div
          key={nft.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <NFTCard 
            nft={nft} 
            showCollection={showCollection}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default NFTGrid;