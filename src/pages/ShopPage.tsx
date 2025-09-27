import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Zap, Trophy, Package, CreditCard, TrendingUp, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';
import { API_CONFIG } from '../config/api.config';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MarketDashboard from '../components/market/MarketDashboard';
import ProductCard from '../components/market/ProductCard';
import PlayersGallery from '../components/player/PlayersGallery';
import PaymentModal from '../components/payment/PaymentModal';
import { ChainType } from '../types';
import { getStoredWallet } from '../utils/walletStorage';
import { useReferral } from '../hooks/useReferral';
import { useAuthStatus } from '../hooks/useAuthStatus';

const ShopPage = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'products' | 'market' | 'orders' | 'players'>('products');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const { registerPendingReferral } = useReferral();
  const isAuthenticated = useAuthStatus();

  const queryClient = useQueryClient();

  // Check API connectivity on mount
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        console.log('🔍 Checking production API connection to:', API_CONFIG.BASE_URL);
        const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        if (response.ok) {
          console.log('✅ Production API connected successfully');
          setApiStatus('connected');
        } else {
          console.warn('⚠️ Production API responded with error:', response.status);
          setApiStatus('offline');
        }
      } catch (error) {
        console.warn('⚠️ Production API connection failed:', error);
        setApiStatus('offline');
      }
    };

    checkApiConnection();
  }, []);

  // Fetch products with robust error handling
  const { data: products, isLoading: productsLoading, error: productsError } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      console.log('🛒 Fetching products from API...');
      try {
        const result = await ApiService.getProducts();
        console.log('✅ Products loaded:', result?.length || 0, 'products');
        return result;
      } catch (error) {
        console.error('❌ Products API failed:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Fetch product variants for selected product
  const { data: variants, isLoading: variantsLoading, error: variantsError } = useQuery({
    queryKey: ['product-variants', selectedProduct],
    queryFn: async () => {
      console.log(`🛒 Fetching variants for product: ${selectedProduct}`);
      try {
        const result = await ApiService.getProductVariants(selectedProduct);
        console.log('✅ Variants loaded:', result?.length || 0, 'variants');
        return result;
      } catch (error) {
        console.error('❌ Variants API failed:', error);
        throw error;
      }
    },
    enabled: !!selectedProduct,
    retry: 1,
    retryDelay: 1000,
  });

  // Fetch user orders with authentication check
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      console.log('📋 Fetching user orders...');
      try {
        const result = await ApiService.getUserOrders();
        console.log('✅ Orders loaded:', result?.length || 0, 'orders');
        return result;
      } catch (error) {
        console.error('❌ Orders API failed:', error);
        throw error;
      }
    },
    enabled: isAuthenticated,
    retry: isAuthenticated ? 2 : false,
    retryDelay: 1000,
    refetchInterval: isAuthenticated ? 30000 : false,
  });

  // Fetch market data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ['market-data'],
    queryFn: async () => {
      console.log('📊 Fetching market data...');
      try {
        const result = await ApiService.getMarketData();
        console.log('✅ Market data loaded');
        return result;
      } catch (error) {
        console.warn('⚠️ Market data not available:', error);
        return { products: [], recentOrders: [], totalVolume: 0 };
      }
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    retry: 0,
  });

  // Fetch real players data
  const { data: realPlayersData, isLoading: playersLoading } = useQuery({
    queryKey: ['real-players-data'],
    queryFn: async () => {
      console.log('👤 Fetching real players data...');
      try {
        const result = await ApiService.getRealPlayersData();
        console.log('✅ Players data loaded:', result?.length || 0, 'players');
        return result;
      } catch (error) {
        console.warn('⚠️ Players data not available:', error);
        return [];
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const productsList = Array.isArray(products) ? products : [];
  const variantsList = Array.isArray(variants) ? variants : [];
  const ordersList = Array.isArray(orders) ? orders : [];
  const realPlayersList = Array.isArray(realPlayersData) ? realPlayersData : [];

  // Create order mutation with robust error handling
  const createOrderMutation = useMutation({
    mutationFn: async ({ variantId, qty, chainType, wallet }: { 
      variantId: string; 
      qty: number; 
      chainType: ChainType; 
      wallet: string; 
    }) => {
      console.log(`💳 Creating order for variant ${variantId}...`);
      try {
        const result = await ApiService.createOrder(variantId, qty, chainType, wallet);
        console.log('✅ Order created successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Order creation failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🎉 Order creation successful, invalidating queries...');
      queryClient.invalidateQueries({ queryKey: ['user-orders'] });
      queryClient.invalidateQueries({ queryKey: ['market-data'] });
      
      // Set pending order for payment modal
      setPendingOrder(data);
      setShowPaymentModal(true);
      
      // Register pending referral if exists
      setTimeout(() => {
        registerPendingReferral();
      }, 1000);
    },
    onError: (error: any) => {
      console.error('❌ Order creation error:', error);
      alert(`Failed to create order: ${error.message || 'Unknown error'}`);
    },
  });

  const handlePurchase = (variantId?: string) => {
    const targetVariant = variantId || selectedVariant;
    
    if (!targetVariant) {
      alert('Please select a pack variant first!');
      return;
    }

    // Get wallet address from localStorage
    const { address: connectedWallet } = getStoredWallet();
    
    if (!connectedWallet) {
      alert('Please connect your wallet first!');
      return;
    }

    console.log(`🛒 Initiating purchase for variant: ${targetVariant}`);
    createOrderMutation.mutate({
      variantId: targetVariant,
      qty: quantity,
      chainType: ChainType.BSC, // Use BSC as default
      wallet: connectedWallet,
    });
  };

  const formatPrice = (price: string | number) => {
    return parseFloat(price.toString()).toLocaleString();
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
          
          {/* API Status Indicator */}
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'connected' ? 'bg-green-400 animate-pulse' :
              apiStatus === 'checking' ? 'bg-yellow-400 animate-pulse' :
              'bg-red-400'
            }`} />
            <span className={`text-sm ${
              apiStatus === 'connected' ? 'text-green-400' :
              apiStatus === 'checking' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {apiStatus === 'connected' ? 'Connected to game.goalplay.pro' :
               apiStatus === 'checking' ? 'Connecting...' :
               'Offline - Using fallback data'}
            </span>
            {apiStatus === 'connected' && (
              <span className="text-xs text-gray-400">
                • Live Data
              </span>
            )}
          </div>
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
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Products List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product Selection */}
                <div className="glass-dark rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-white">Available Products</h2>
                    {productsError && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">API Error - Using fallback</span>
                      </div>
                    )}
                    {!productsError && productsList.length > 0 && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Live API Data</span>
                      </div>
                    )}
                  </div>
                  
                  {productsLoading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" text="Loading products from API..." />
                    </div>
                  ) : productsList.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-500" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No Products Available</h3>
                      <p className="text-gray-400">
                        {productsError ? 'API connection failed. Please try again later.' : 'Check back later for new player packs'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {productsList.map((product) => (
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
                            <div className={`w-16 h-16 bg-gradient-to-r ${
                              product.name.includes('Primera') ? 'from-yellow-400 to-orange-500' :
                              product.name.includes('Segunda') ? 'from-blue-400 to-cyan-500' :
                              'from-gray-400 to-gray-500'
                            } rounded-lg flex items-center justify-center`}>
                              <span className="text-2xl">
                                {product.name.includes('Primera') ? '👑' :
                                 product.name.includes('Segunda') ? '🥈' : '🥉'}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                              <p className="text-gray-400 text-sm">{product.description}</p>
                              <div className="mt-2 flex items-center space-x-2">
                                <span className="text-xs bg-football-green/20 text-football-green px-2 py-1 rounded-full">
                                  {product.type.replace('_', ' ').toUpperCase()}
                                </span>
                                {product.isActive && (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                                    AVAILABLE
                                  </span>
                                )}
                              </div>
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
                </div>

                {/* Product Variants */}
                {selectedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-dark rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-semibold text-white">Pack Variants</h2>
                      {variantsError && (
                        <div className="flex items-center space-x-2 text-red-400">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm">Variants unavailable</span>
                        </div>
                      )}
                    </div>
                    
                    {variantsLoading ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner text="Loading variants from API..." />
                      </div>
                    ) : variantsList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {variantsList.map((variant) => (
                          <ProductCard
                            key={variant.id}
                            variant={variant}
                            onPurchase={(variantId) => {
                              setSelectedVariant(variantId);
                              handlePurchase(variantId);
                            }}
                            isPurchasing={createOrderMutation.isPending}
                            order={pendingOrder?.productVariantId === variant.id ? pendingOrder : null}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-400">
                          {variantsError ? 'Failed to load variants' : 'No variants available for this product'}
                        </p>
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
                  
                  {selectedVariant && variantsList.length > 0 ? (
                    <div className="space-y-6">
                      {/* Selected Pack Info */}
                      <div className="text-center">
                        <div className="text-lg font-semibold text-white mb-2">
                          {variantsList.find(v => v.id === selectedVariant)?.name}
                        </div>
                        <div className="text-2xl font-bold text-football-green">
                          ${formatPrice(variantsList.find(v => v.id === selectedVariant)?.priceUSDT || '0')} USDT
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          Division: {variantsList.find(v => v.id === selectedVariant)?.division} • 
                          Level: {variantsList.find(v => v.id === selectedVariant)?.level}
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
                            ${formatPrice((parseFloat(variantsList.find(v => v.id === selectedVariant)?.priceUSDT || '0') * quantity).toFixed(2))} USDT
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
                      <div className="text-xs text-gray-400 text-center space-y-1">
                        <p>Payment will be processed on BSC network</p>
                        <p>You'll receive your players after payment confirmation</p>
                        <p className="text-football-green">Connected to: {API_CONFIG.BASE_URL}</p>
                        <p className="text-football-green">Production API: {API_CONFIG.BASE_URL}</p>
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
                  
                  {!isAuthenticated ? (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      Connect your wallet to see your recent orders.
                    </div>
                  ) : ordersLoading ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" text="Loading orders from API..." />
                    </div>
                  ) : ordersError ? (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center space-x-2 text-red-400 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Failed to load orders</span>
                      </div>
                      <p className="text-gray-400 text-xs">Check your connection and try again</p>
                    </div>
                  ) : ordersList.length > 0 ? (
                    <div className="space-y-3">
                      {ordersList.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 glass rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-white">
                              Order #{order.id.slice(0, 8)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleDateString()} • Qty: {order.quantity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-football-green">
                              ${formatPrice(order.totalPriceUSDT)}
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

          {activeTab === 'market' && (
            <div className="space-y-6">
              {marketLoading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" text="Loading market data from API..." />
                </div>
              ) : (
                <MarketDashboard />
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="glass-dark rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">My Orders</h3>
                {ordersError && (
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">API Error</span>
                  </div>
                )}
              </div>
              
              {!isAuthenticated ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingBag className="w-16 h-16 text-gray-500 mx-auto" />
                  <p className="text-gray-400">Connect your wallet to view your order history.</p>
                </div>
              ) : ordersLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner text="Loading orders from API..." />
                </div>
              ) : ordersError ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">Failed to Load Orders</h4>
                  <p className="text-gray-400 mb-4">Unable to connect to API. Please try again.</p>
                  <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['user-orders'] })}
                    className="btn-primary"
                  >
                    Retry
                  </button>
                </div>
              ) : ordersList.length > 0 ? (
                <div className="space-y-4">
                  {ordersList.map((order) => (
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
                            {new Date(order.createdAt).toLocaleDateString()} • 
                            Qty: {order.quantity} • 
                            Chain: {order.chainType.toUpperCase()}
                          </div>
                          {order.transactionHash && (
                            <div className="text-xs text-football-blue font-mono">
                              TX: {order.transactionHash.slice(0, 10)}...
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-football-green font-semibold">
                          ${formatPrice(order.totalPriceUSDT)} USDT
                        </div>
                        <div className={`text-xs font-semibold ${
                          order.status === 'fulfilled' ? 'text-green-400' :
                          order.status === 'paid' ? 'text-blue-400' :
                          order.status === 'pending' ? 'text-yellow-400' :
                          order.status === 'expired' ? 'text-gray-400' :
                          'text-red-400'
                        }`}>
                          {order.status.toUpperCase()}
                        </div>
                        {order.paidAt && (
                          <div className="text-xs text-gray-400">
                            Paid: {new Date(order.paidAt).toLocaleDateString()}
                          </div>
                        )}
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

          {activeTab === 'players' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-display font-bold gradient-text mb-4">
                  Players Gallery
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Discover all available players across different divisions with their stats and abilities
                </p>
                {playersLoading && (
                  <div className="mt-4 flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    <span className="text-blue-400 text-sm">Loading from API...</span>
                  </div>
                )}
              </div>

              {playersLoading ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner size="lg" text="Loading players from API..." />
                </div>
              ) : realPlayersList.length > 0 ? (
                <div className="space-y-8">
                  {['primera', 'segunda', 'tercera'].map((div) => (
                    <div key={div} className="glass-dark rounded-xl p-6">
                      <h3 className="text-xl font-semibold text-white mb-6 flex items-center space-x-3">
                        <span className="text-2xl">
                          {div === 'primera' ? '👑' : div === 'segunda' ? '🥈' : '🥉'}
                        </span>
                        <span>{div.charAt(0).toUpperCase() + div.slice(1)} División</span>
                        <span className="text-sm text-gray-400">
                          ({realPlayersList.filter(p => p.division === div).length} players)
                        </span>
                      </h3>
                      
                      <PlayersGallery
                        division={div}
                        selectedPlayer={selectedPlayer}
                        onPlayerSelect={(playerName) => {
                          console.log(`Selected player: ${playerName} from ${div} division`);
                          setSelectedPlayer(playerName);
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
                  <p className="text-gray-400">
                    {apiStatus === 'offline' ? 'API connection failed. Using offline mode.' : 'Player data is currently not available'}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

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
              <p className="text-gray-400 text-sm">Choose your division and complete payment via API</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Gacha Draw</h4>
              <p className="text-gray-400 text-sm">Backend executes gacha draw automatically</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Get Players</h4>
              <p className="text-gray-400 text-sm">Players added to your inventory via API</p>
            </div>
          </div>

          {/* API Connection Status */}
          <div className="mt-6 p-4 glass rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${
                apiStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-sm text-gray-400">
                Production API Status: {apiStatus === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Production API: https://game.goalplay.pro/api/
            </p>
          </div>
        </motion.div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && pendingOrder && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPendingOrder(null);
          }}
          order={pendingOrder}
        />
      )}
    </div>
  );
};

export default ShopPage;
