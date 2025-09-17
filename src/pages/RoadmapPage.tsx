import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, Clock, Target, Rocket, Trophy, Globe, Zap } from 'lucide-react';

const RoadmapPage: React.FC = () => {
  const phases = [
    {
      phase: "Fase 1",
      period: "Enero - Mayo 2025",
      status: "in-progress",
      icon: <Target className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
      items: [
        "Formación del equipo fundador y expansión inicial",
        "Análisis exhaustivo del mercado cripto GameFi",
        "Desarrollo del plan de negocio y estrategia inicial",
        "Establecimiento de la estructura legal y operativa",
        "Inicio de la construcción de presencia en redes sociales",
        "Diseño de Tokenomics",
        "Creación del Whitepaper, Roadmap y Página Web"
      ]
    },
    {
      phase: "Fase 2",
      period: "Junio - Septiembre 2025",
      status: "upcoming",
      icon: <Rocket className="w-8 h-8" />,
      color: "from-green-500 to-emerald-500",
      items: [
        "Lanzamiento token GOAL",
        "Auditoría de GOAL smart contract",
        "Lanzamiento de comunidades en Twitter, TikTok, Discord y Telegram",
        "Venta de personajes para Juego penaltis",
        "Estrenamos Juego Penaltis",
        "Campaña publicitaria de gran fuerza",
        "Diseño de los NFTs para juegos en Fase 3",
        "Preventa NFT especial con ventajas únicas",
        "Lanzamos el juego Penaltis Multi-jugador",
        "¡Vamos multi-chain! La comunidad decidirá (Solana, Ethereum, Base)"
      ]
    },
    {
      phase: "Fase 3",
      period: "Octubre - Noviembre 2025",
      status: "upcoming",
      icon: <Trophy className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500",
      items: [
        "Campañas publicitarias recurrentes",
        "Lanzamiento de Ligas NFT",
        "Estrenamos juego Fútbol 11 vs 11",
        "Introducción NFT Marketplace interno",
        "Expansión con nuevos ítems y personajes NFT",
        "Abrimos tienda Merchandise",
        "Incorporación de patrocinadores deportivos",
        "Liquidez y trading en 2-3 Exchange Centralizadas (CEX)"
      ]
    },
    {
      phase: "Fase 4",
      period: "Diciembre 2025 - Junio 2026",
      status: "future",
      icon: <Globe className="w-8 h-8" />,
      color: "from-orange-500 to-red-500",
      items: [
        "Desarrollo del Metaverso Goal Play",
        "Integración de experiencias sociales y comerciales",
        "Implementación de roles: Presidente, Representante, Entrenador, Mánager",
        "Expansión a más Exchanges Centralizadas (CEX)",
        "Campaña publicitaria de alto impacto",
        "Lanzamiento Metaverso Goal Play",
        "Eventos PvP, torneos y ligas competitivas",
        "Ampliación de utilidades del token GOAL: recompensas, gobernanza, eventos exclusivos"
      ]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'in-progress':
        return <Clock className="w-6 h-6 text-blue-500" />;
      default:
        return <Calendar className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900">
      {/* Hero Section */}
      <div className="relative py-20 px-4">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Roadmap
            </h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-3xl mx-auto leading-relaxed">
              El camino hacia la revolución del fútbol digital está trazado. 
              Aquí te mostramos las fases clave de nuestro desarrollo y lanzamiento al mercado.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Roadmap Timeline */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-500 via-green-500 via-purple-500 to-orange-500 rounded-full" />
            
            {phases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`relative flex items-center mb-16 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline Node */}
                <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 -translate-y-1/2 top-1/2">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${phase.color} flex items-center justify-center shadow-lg border-4 border-white`}>
                    {phase.icon}
                  </div>
                </div>

                {/* Content Card */}
                <div className={`w-full md:w-5/12 ml-24 md:ml-0 ${
                  index % 2 === 0 ? 'md:mr-auto md:pr-16' : 'md:ml-auto md:pl-16'
                }`}>
                  <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {phase.phase}
                        </h3>
                        <p className="text-green-200 font-medium">
                          {phase.period}
                        </p>
                      </div>
                      {getStatusIcon(phase.status)}
                    </div>

                    <ul className="space-y-3">
                      {phase.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: itemIndex * 0.1 }}
                          className="flex items-start space-x-3"
                        >
                          <Zap className="w-4 h-4 text-yellow-400 mt-1 flex-shrink-0" />
                          <span className="text-white/90 text-sm leading-relaxed">
                            {item}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              ¡Únete a la Revolución!
            </h2>
            <p className="text-xl text-green-100 mb-8 leading-relaxed">
              Sé parte de Goal Play desde el inicio y vive cada fase de esta increíble aventura. 
              El futuro del fútbol digital comienza ahora.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Únete a la Comunidad
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white/20 text-white font-bold rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
              >
                Leer Whitepaper
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapPage;