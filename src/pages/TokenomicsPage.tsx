import React from 'react';
import { motion } from 'framer-motion';
import { Coins, PieChart, TrendingUp, Users, Zap, Shield } from 'lucide-react';
import AddToMetaMask from '../components/common/AddToMetaMask';

const TokenomicsPage = () => {
  const tokenDistribution = [
    { label: 'Recompensas Play-to-Earn', percentage: 30, color: 'bg-green-500', description: 'Recompensas para jugadores activos' },
    { label: 'Community Rewards', percentage: 15, color: 'bg-blue-500', description: 'Incentivos para la comunidad' },
    { label: 'Marketing', percentage: 10, color: 'bg-purple-500', description: 'Promoción y crecimiento' },
    { label: 'Liquidez DEX y CEX', percentage: 10, color: 'bg-yellow-500', description: 'Liquidez en exchanges' },
    { label: 'Token Burning', percentage: 10, color: 'bg-red-500', description: 'Mecanismo deflacionario' },
    { label: 'Desarrolladores', percentage: 10, color: 'bg-indigo-500', description: 'Equipo de desarrollo' },
    { label: 'Tesorería', percentage: 5, color: 'bg-gray-500', description: 'Reservas del proyecto' },
    { label: 'Venta Pública', percentage: 8, color: 'bg-orange-500', description: 'Venta al público general' },
    { label: 'Venta Privada', percentage: 2, color: 'bg-pink-500', description: 'Inversores privados' }
  ];

  const tokenFeatures = [
    {
      icon: <Coins className="w-8 h-8" />,
      title: 'Suministro Total',
      value: '1,000,000,000 GOAL',
      description: 'Suministro fijo sin inflación'
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: 'Blockchain Inicial',
      value: 'Binance Smart Chain',
      description: 'Rápido y económico para gaming'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Staking APY',
      value: 'Hasta 25%',
      description: 'Doble recompensas primeras 4 semanas'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Auditoría',
      value: 'Smart Contract',
      description: 'Seguridad verificada por terceros'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              GOAL <span className="text-yellow-400">Tokenomics</span>
            </h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto">
              Economía sostenible diseñada para recompensar a jugadores, 
              construir comunidad y generar valor a largo plazo
            </p>
          </motion.div>
        </div>
      </div>

      {/* Token Features */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {tokenFeatures.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <div className="text-yellow-400 mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-2xl font-bold text-yellow-400 mb-2">{feature.value}</p>
              <p className="text-green-100 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Distribution Chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 mb-16"
        >
          <div className="flex items-center justify-center mb-8">
            <PieChart className="w-8 h-8 text-yellow-400 mr-3" />
            <h2 className="text-3xl font-bold text-white">Distribución de Tokens</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Visual Distribution */}
            <div className="space-y-4">
              {tokenDistribution.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div className={`w-4 h-4 rounded-full ${item.color}`} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">{item.label}</span>
                      <span className="text-yellow-400 font-bold">{item.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className={`h-2 rounded-full ${item.color}`}
                      />
                    </div>
                    <p className="text-green-100 text-sm mt-1">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Key Highlights */}
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">🎮 Play-to-Earn Focus</h3>
                <p className="text-green-100">
                  <strong>45%</strong> del suministro total dedicado a recompensar jugadores 
                  y construir comunidad activa
                </p>
              </div>

              <div className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">🔥 Mecanismo Deflacionario</h3>
                <p className="text-yellow-100">
                  <strong>10%</strong> reservado para burning sistemático, 
                  reduciendo suministro y aumentando valor
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">💎 Staking Rewards</h3>
                <p className="text-blue-100">
                  Hasta <strong>25% APY</strong> en las primeras 4 semanas, 
                  luego ajuste lineal para sostenibilidad
                </p>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">🚀 Multi-Chain Future</h3>
                <p className="text-purple-100">
                  Inicio en BSC, expansión a Solana, Ethereum y Base 
                  decidida por la comunidad
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Add to MetaMask Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 mb-16"
          id="add-token-section"
        >
          <div className="max-w-2xl mx-auto">
            <AddToMetaMask showTitle={true} size="lg" />
          </div>
        </motion.div>

        {/* Utility Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20"
        >
          <div className="flex items-center justify-center mb-8">
            <Users className="w-8 h-8 text-yellow-400 mr-3" />
            <h2 className="text-3xl font-bold text-white">Utilidades del Token GOAL</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-400/30">
              <h3 className="text-xl font-bold text-white mb-3">🎯 Gameplay</h3>
              <ul className="text-green-100 space-y-2">
                <li>• Compra de NFT packs</li>
                <li>• Mejoras de jugadores</li>
                <li>• Entrada a torneos</li>
                <li>• Recompensas por victorias</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-400/30">
              <h3 className="text-xl font-bold text-white mb-3">💰 Staking</h3>
              <ul className="text-yellow-100 space-y-2">
                <li>• Ingresos pasivos</li>
                <li>• Bonificaciones especiales</li>
                <li>• Acceso VIP</li>
                <li>• Descuentos en tienda</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-400/30">
              <h3 className="text-xl font-bold text-white mb-3">🏛️ Gobernanza</h3>
              <ul className="text-blue-100 space-y-2">
                <li>• Votación en decisiones</li>
                <li>• Selección de blockchains</li>
                <li>• Nuevas características</li>
                <li>• Partnerships estratégicos</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TokenomicsPage;