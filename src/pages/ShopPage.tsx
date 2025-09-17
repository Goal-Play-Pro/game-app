import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Zap, Trophy, Package, CreditCard, TrendingUp } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MarketDashboard from '../components/market/MarketDashboard';
import ProductCard from '../components/market/ProductCard';
import PlayersGallery from '../components/player/PlayersGallery';
import { ChainType } from '../types';
import { useReferral } from '../hooks/useReferral';

const formatPrice = (price: string | number) => {
  return parseFloat(price.toString()).toLocaleString();
};

const ShopPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'products' | 'market' | 'orders' | 'players'>('products');
  const { registerPendingReferral } = useReferral();

  const queryClient = useQueryClient();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: ApiService.getProducts,
  });

  // Fetch product variants for selected product
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', selectedProduct],
    queryFn: () => ApiService.getProductVariants(selectedProduct),
    enabled: !!selectedProduct,
  });

  // Fetch user orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: ApiService.getUserOrders,
  });

  // Fetch market data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-data'],
    queryFn: ApiService.getMarketData,
    refetchInterval: 30000,
  });

  // Fetch real players data
  const { data: realPlayersData, isLoading: playersLoading } = useQuery({
    queryKey: ['real-players-data'],
    queryFn: ApiService.getRealPlayersData,
  });
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: ({ variantId, qty, chainType, wallet }: { 
      variantId: string; 
      qty: number; 
      chainType: ChainType; 
      wallet: string; 
    }) => ApiService.createOrder(variantId, qty, chainType, wallet),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['market-data'] });
      alert('Order created successfully! Please complete the payment.');
      
      // Register pending referral if exists
      setTimeout(() => {
        registerPendingReferral();
      }, 1000);
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
      alert('Failed to create order. Please try again.');
    },
  });

  const handlePurchase = (variantId?: string) => {
    const targetVariant = variantId || selectedVariant;
    
    if (!targetVariant) {
      alert('Please select a pack variant first!');
      return;
    }

    // Mock wallet address - in real app this would come from connected wallet
    const mockWallet = '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000';

    createOrderMutation.mutate({
      variantId: targetVariant,
      qty: quantity,
      chainType: ChainType.ETHEREUM,
      wallet: mockWallet,
    });
  };

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

  if (productsLoading) {
    return (
      <div className="pt-24 pb-20 flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading shop..." />
      </div>
    );
  }

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
            Marketplace
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Discover player packs, view market data, and manage your orders
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center space-x-1 mb-8 glass-dark rounded-lg p-1"
        >
          {[
            { id: 'products', label: 'Products', icon: Package },
            { id: 'market', label: 'Market Data', icon: TrendingUp },
            { id: 'orders', label: 'My Orders', icon: ShoppingBag },
            { id: 'players', label: 'Players Gallery', icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-football-green text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </motion.div>
        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {activeTab === 'market' && (
            <MarketDashboard />
          )}

          {activeTab === 'players' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold gradient-text mb-4">
                  Players Gallery
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Discover all available players across different divisions with their stats and abilities
                </p>
              </div>

              {playersLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" text="Loading players..." />
                </div>
              ) : realPlayersData ? (
                <div className="space-y-8">
                  {['primera', 'segunda', 'tercera'].map((div) => (
                    <div key={div} className="glass-dark rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-6">
                        {div.charAt(0).toUpperCase() + div.slice(1)} División
                      </h3>
                      
                      <PlayersGallery
                        division={div}
                        selectedPlayer={selectedPlayer}
                        onPlayerSelect={(playerName) => {
                          console.log(`Selected player: ${playerName} from ${div} division`);
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Players Not Available</h3>
                  <p className="text-gray-400">Player data is currently not available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="glass-dark rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">My Orders</h3>
              
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner text="Loading orders..." />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 glass rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-lg flex items-center justify-center">
                          <Trophy className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            Order #{order.id.slice(0, 8)}
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString()} • Qty: {order.quantity}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-football-green font-semibold">
                          {formatPrice(order.totalPriceUSDT)} USDT
                        </div>
                        <div className={`text-xs ${
                          order.status === 'fulfilled' ? 'text-green-400' :
                          order.status === 'paid' ? 'text-blue-400' :
                          order.status === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {order.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Orders Yet</h4>
                  <p className="text-gray-400">Your purchase history will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-dark rounded-xl p-6"
            >
              <h2 className="text-2xl font-semibold text-white mb-6">Available Products</h2>
              
              {!products || products.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Products Available</h3>
                  <p className="text-gray-400">Check back later for new player packs</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <motion.div
                      key={product.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedProduct(product.id)}
                      className={`game-card cursor-pointer ${
                        selectedProduct === product.id ? 'ring-2 ring-football-green' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-lg flex items-center justify-center">
                          <Trophy className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                          <p className="text-gray-400 text-sm">{product.description}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-football-green font-semibold">Available</div>
                          <div className="text-sm text-gray-400">Multiple variants</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Product Variants */}
            {selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-dark rounded-xl p-6"
              >
                <h2 className="text-2xl font-semibold text-white mb-6">Pack Variants</h2>
                
                {variantsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner text="Loading variants..." />
                  </div>
                ) : variants && variants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {variants.map((variant) => (
                      <ProductCard
                        key={variant.id}
                        variant={variant}
                        onPurchase={(variantId) => {
                          setSelectedVariant(variantId);
                          handlePurchase(variantId);
                        }}
                        isPurchasing={createOrderMutation.isPending}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No variants available for this product</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Purchase Panel */}
          <div className="space-y-6">
            {/* Purchase Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-dark rounded-xl p-6 sticky top-24"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Purchase Pack</h3>
              
              {selectedVariant ? (
                <div className="space-y-6">
                  {/* Selected Pack Info */}
                  <div className="text-center">
                    <div className="text-lg font-semibold text-white mb-2">
                      {variants?.find(v => v.id === selectedVariant)?.name}
                    </div>
                    <div className="text-2xl font-bold text-football-green">
                      ${variants?.find(v => v.id === selectedVariant)?.priceUSDT} USDT
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Quantity
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full input-field text-center"
                        />
                      </div>
                      <button
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="border-t border-white/10 pt-4">
                    <div className="flex justify-between text-lg">
                      <span className="text-gray-400">Total:</span>
                      <span className="font-bold text-football-green">
                        ${(parseFloat(variants?.find(v => v.id === selectedVariant)?.priceUSDT || '0') * quantity).toLocaleString()} USDT
                      </span>
                    </div>
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={() => handlePurchase()}
                    disabled={createOrderMutation.isPending}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {createOrderMutation.isPending ? (
                      <LoadingSpinner size="sm" color="white" />
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Purchase Pack</span>
                      </>
                    )}
                  </button>

                  {/* Payment Info */}
                  <div className="text-xs text-gray-400 text-center">
                    <p>Payment will be processed on Ethereum network</p>
                    <p>You'll receive your players after payment confirmation</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShoppingBag className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Select a Pack</h4>
                  <p className="text-gray-400 text-sm">Choose a product and variant to purchase</p>
                </div>
              )}
            </motion.div>

            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-dark rounded-xl p-6"
            >
              <h3 className="text-xl font-semibold text-white mb-6">Recent Orders</h3>
              
              {ordersLoading ? (
                <div className="flex justify-center py-4">
                  <LoadingSpinner size="sm" text="Loading orders..." />
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 glass rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-white">
                          Order #{order.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-football-green">
                          ${order.totalPriceUSDT}
                        </div>
                        <div className={`text-xs ${
                          order.status === 'fulfilled' ? 'text-green-400' :
                          order.status === 'paid' ? 'text-blue-400' :
                          order.status === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {order.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No recent orders</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
          )}

        {/* Pack Opening Animation Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 glass-dark rounded-xl p-6 text-center"
        >
          <div className="flex items-center justify-center space-x-4 mb-4">
            <Zap className="w-8 h-8 text-football-green" />
            <h3 className="text-xl font-semibold text-white">How Pack Opening Works</h3>
            <Zap className="w-8 h-8 text-football-green" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Purchase Pack</h4>
              <p className="text-gray-400 text-sm">Choose your division and complete payment</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Open Pack</h4>
              <p className="text-gray-400 text-sm">Watch the exciting pack opening animation</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Get Players</h4>
              <p className="text-gray-400 text-sm">Add new players to your collection</p>
            </div>
          </div>
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ShopPage;