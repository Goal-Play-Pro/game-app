import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Info, Zap, Trophy } from 'lucide-react';
import { ProductVariant } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface ProductCardProps {
  variant: ProductVariant;
  onPurchase: (variantId: string) => void;
  isPurchasing?: boolean;
  className?: string;
}

const ProductCard = ({ variant, onPurchase, isPurchasing = false, className = '' }: ProductCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getDivisionColor = (division: string) => {
    switch (division.toLowerCase()) {
      case 'primera': return 'from-yellow-400 to-orange-500';
      case 'segunda': return 'from-blue-400 to-cyan-500';
      case 'tercera': return 'from-gray-400 to-gray-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getDivisionIcon = (division: string) => {
    switch (division.toLowerCase()) {
      case 'primera': return '👑';
      case 'segunda': return '🥈';
      case 'tercera': return '🥉';
      default: return '⚽';
    }
  };

  const getDivisionBadge = (division: string) => {
    switch (division.toLowerCase()) {
      case 'primera': return 'PRIMERA';
      case 'segunda': return 'SEGUNDA';
      case 'tercera': return 'TERCERA';
      default: return division.toUpperCase();
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(parseFloat(price));
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={`game-card group cursor-pointer relative overflow-hidden ${className}`}
    >
      {/* Division Badge */}
      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
        variant.division === 'primera' ? 'bg-yellow-500/20 text-yellow-400' :
        variant.division === 'segunda' ? 'bg-blue-500/20 text-blue-400' :
        'bg-gray-500/20 text-gray-400'
      }`}>
        {getDivisionBadge(variant.division)}
      </div>

      {/* Level Badge */}
      <div className="absolute top-3 left-3 px-2 py-1 bg-football-green/20 text-football-green text-xs font-bold rounded-full">
        NIVEL {variant.level}
      </div>

      {/* Pack Image */}
      <div className={`aspect-square bg-gradient-to-br ${getDivisionColor(variant.division)} rounded-lg mb-4 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 text-center">
          <div className="text-6xl mb-2">{getDivisionIcon(variant.division)}</div>
          <div className="text-white font-bold text-lg">PACK</div>
        </div>
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Info Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }}
          className="absolute top-2 right-2 p-2 bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <Info className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Pack Info */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-football-green transition-colors">
          {variant.name}
        </h3>
        
        <p className="text-gray-400 text-sm line-clamp-2">
          {variant.description}
        </p>

        {/* Price */}
        <div className="text-center">
          <div className="text-2xl font-bold text-football-green mb-1">
            {formatPrice(variant.priceUSDT)}
          </div>
          <div className="text-sm text-gray-400">USDT</div>
        </div>

        {/* Pack Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-center p-2 glass rounded">
            <div className="text-white font-semibold">División</div>
            <div className="text-gray-400">{variant.division.charAt(0).toUpperCase() + variant.division.slice(1)}</div>
          </div>
          <div className="text-center p-2 glass rounded">
            <div className="text-white font-semibold">Nivel</div>
            <div className="text-gray-400">{variant.level}/5</div>
          </div>
        </div>

        {/* Purchase Limits */}
        {variant.maxPurchasesPerUser && (
          <div className="text-center">
            <div className="text-xs text-yellow-400">
              Limited: {variant.maxPurchasesPerUser} per user
            </div>
          </div>
        )}

        {/* Purchase Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPurchase(variant.id)}
          disabled={isPurchasing}
          className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {isPurchasing ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" />
              <span>Buy Pack</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Detailed Info Modal */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/90 rounded-lg p-4 z-20"
          onClick={() => setShowDetails(false)}
        >
          <div className="text-center text-white space-y-3">
            <h4 className="font-bold text-lg">{variant.name}</h4>
            <p className="text-sm text-gray-300">{variant.description}</p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>División:</span>
                <span className="font-semibold">{variant.division}</span>
              </div>
              <div className="flex justify-between">
                <span>Nivel:</span>
                <span className="font-semibold">{variant.level}</span>
              </div>
              <div className="flex justify-between">
                <span>Precio:</span>
                <span className="font-semibold text-football-green">{formatPrice(variant.priceUSDT)}</span>
              </div>
              <div className="flex justify-between">
                <span>Pool ID:</span>
                <span className="font-mono text-xs">{variant.gachaPoolId}</span>
              </div>
            </div>
            
            <button
              onClick={() => setShowDetails(false)}
              className="btn-secondary text-sm mt-4"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProductCard;