import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Users, Zap, Star, Trophy, Target, Gamepad2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import ApiService from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AddToMetaMask from '../components/common/AddToMetaMask';
import WalletConnect from '../components/wallet/WalletConnect';
import { useReferral } from '../hooks/useReferral';

const HomePage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { registerPendingReferral } = useReferral();

  // Fetch data from backend API
  const { data: gameStats, isLoading: statsLoading } = useQuery({
    queryKey: ['game-stats'],
    queryFn: () => ApiService.getGameStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => ApiService.getProducts(),
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => ApiService.getLeaderboard(),
  });

  const { data: apiInfo } = useQuery({
    queryKey: ['api-info'],
    queryFn: () => ApiService.getApiInfo(),
  });

  // Check for referral code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
      console.log(`🎯 Referral code detected: ${referralCode}`);
      // The useReferral hook will handle storing this
    }
  }, []);

  // Hero slides
  const heroSlides = [
    {
      title: "Master the Art of Penalty Shootouts",
      subtitle: "Experience the thrill of football gaming with blockchain rewards and NFT player collections",
      image: "https://images.pexels.com/photos/274506/pexels-photo-274506.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Start Playing"
    },
    {
      title: "Collect Legendary NFT Players",
      subtitle: "Build your ultimate team with unique player cards and customize their kits",
      image: "https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Open Packs"
    },
    {
      title: "Compete in Global Tournaments",
      subtitle: "Challenge players worldwide and climb the leaderboards to earn exclusive rewards",
      image: "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg?auto=compress&cs=tinysrgb&w=800",
      cta: "Join Tournament"
    }
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="pt-14 sm:pt-16 lg:pt-20">
      {/* Hero Section */}
      <section className="relative hero-section overflow-hidden">
        {/* Background Slides */}
        <div className="absolute inset-0">
          {heroSlides.map((slide, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: index === currentSlide ? 1 : 0 }}
              transition={{ duration: 1 }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            </motion.div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container-responsive">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="margin-responsive-b"
              >
                <h1 className="hero-title font-display font-bold margin-responsive-b">
                  <span className="gradient-text">Goal Play</span>
                </h1>
                <p className="text-responsive-lg text-white font-semibold mb-2">
                  Una nueva forma de vivir el fútbol
                </p>
                <p className="text-responsive-base text-football-green font-bold">
                  ¡sin límites!
                </p>
              </motion.div>
              
              <motion.h1
                key={currentSlide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-responsive-lg font-display font-bold margin-responsive-b"
              >
                <span className="text-white">
                  {heroSlides[currentSlide].title}
                </span>
              </motion.h1>
              
              <motion.p
                key={`subtitle-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-responsive-base text-gray-300 margin-responsive-b max-w-responsive-md leading-responsive"
              >
                {heroSlides[currentSlide].subtitle}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex flex-col sm:flex-row gap-responsive justify-center lg:justify-start"
              >
                <Link to="/game" className="btn-primary flex items-center justify-center space-x-2 touch-target">
                  <span>{heroSlides[currentSlide].cta}</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                <Link to="/shop" className="btn-outline touch-target text-center">
                  Visit Shop
                </Link>
              </motion.div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6 order-1 lg:order-2"
            >
              {statsLoading ? (
                <div className="col-span-2 flex justify-center padding-responsive">
                  <LoadingSpinner text="Loading stats..." />
                </div>
              ) : gameStats && [
                { label: 'Total Players', value: formatNumber(gameStats.totalUsers), icon: Users },
                { label: 'Games Played', value: formatNumber(gameStats.totalGames), icon: Gamepad2 },
                { label: 'Active Players', value: formatNumber(gameStats.activeUsers), icon: Zap },
                { label: 'Total Rewards', value: `$${gameStats.totalRewards}`, icon: Star }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  className="glass-dark rounded-responsive padding-responsive text-center"
                >
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-football-green mx-auto mb-2" />
                  <div className="text-responsive-lg font-bold text-white mb-1">
                    {stat.value}
                  </div>
                  <div className="text-responsive-xs text-gray-400">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 touch-target ${
                index === currentSlide 
                  ? 'bg-football-green scale-125' 
                  : 'bg-white/30 hover:bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Genesis Story Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-dark-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-6">
              El Génesis Virtual
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-gray-300 text-lg leading-relaxed">
                Todo comenzó con un grupo de amigos que crecieron pateando pelotas en las calles polvorientas de su ciudad. 
                Soñábamos con estadios llenos, goles legendarios y camisetas intercambiadas como trofeos.
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                Años después, ya adultos y fascinados por el mundo cripto, nos reunimos un viernes en un bar para hablar 
                sobre fútbol y la vida. Entre bromas y discusión eterna de quién es el mejor jugador de todos los tiempos, 
                uno de nosotros de pronto dijo:
              </p>
              
              <blockquote className="text-xl text-football-green font-semibold italic border-l-4 border-football-green pl-6">
                "¿Y qué pasa si uno junta el fútbol con tecnología blockchain?"
              </blockquote>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                Nos miramos, como si el tiempo se detuviera por un momento. Y sentimos que estábamos a punto de crear algo único.
              </p>
              
              <p className="text-gray-300 text-lg leading-relaxed">
                Así nació la idea: un juego donde cada fan se convierte en protagonista de su propio juego, 
                y patear un balón digital genera ganancias reales.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square bg-gradient-to-br from-football-green/20 to-football-blue/20 rounded-2xl p-8 glass-dark">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white text-4xl">⚽</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Bienvenido a Goal Play
                  </h3>
                  <p className="text-football-green font-semibold text-lg">
                    Una nueva forma de vivir el fútbol, ¡sin límites!
                  </p>
                  <p className="text-gray-300">
                    Ninguno de nosotros sabía cómo hacer ese juego, pero todos sentíamos que debía existir. 
                    Y a veces, eso es suficiente para darle vida a un sueño.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Game Phases Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              De los Penaltis al Metaverso
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              La Revolución del Fútbol Digital diseñada para brindar una experiencia inmersiva
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                phase: "Fase 1",
                title: "Duelos de Penaltis",
                subtitle: "Reta a otro jugador",
                description: "Captura la adrenalina de los momentos más decisivos del fútbol. Juego en tiempo real donde los jugadores se enfrentan en duelos de penales, probando precisión, reflejos y estrategia.",
                icon: "🎯",
                status: "Disponible Ahora",
                color: "from-football-green to-football-blue"
              },
              {
                phase: "Fase 2",
                title: "Partidos 11 vs 11",
                subtitle: "Juegos de cartas NFT",
                description: "Sistema de juego completo con partidos multijugador, gestión de equipos y cartas NFT coleccionables. La táctica, el entrenamiento y la configuración del equipo son claves.",
                icon: "🏟️",
                status: "Próximamente",
                color: "from-football-blue to-football-purple"
              },
              {
                phase: "Fase 3",
                title: "Metaverso Goal Play",
                subtitle: "Experiencia VR",
                description: "Experiencia inmersiva en un entorno virtual donde los usuarios participan en eventos, ligas y torneos personalizados con plena propiedad sobre sus activos digitales.",
                icon: "🌐",
                status: "En Desarrollo",
                color: "from-football-purple to-football-orange"
              }
            ].map((phase, index) => (
              <motion.div
                key={phase.phase}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="game-card text-center group relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 px-3 py-1 bg-football-green/20 text-football-green text-xs font-bold rounded-full">
                  {phase.status}
                </div>
                
                <div className={`w-20 h-20 bg-gradient-to-r ${phase.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <span className="text-3xl">{phase.icon}</span>
                </div>
                
                <div className="text-sm text-football-green font-semibold mb-2">{phase.phase}</div>
                <h3 className="text-xl font-semibold text-white mb-2">{phase.title}</h3>
                <p className="text-football-blue font-medium mb-4">{phase.subtitle}</p>
                <p className="text-gray-400 text-sm">{phase.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              NFT - Personajes
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Futbolistas y Estadios NFT: Tu juego, tu legado
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Futbolistas NFT',
                description: 'Cada futbolista NFT es una pieza única con identidad propia. Modelos inspirados en leyendas reales y héroes imaginarios.',
                color: 'from-football-green to-football-blue'
              },
              {
                icon: Target,
                title: 'Estadios NFT',
                description: 'Los estadios NFT son el corazón del ecosistema competitivo. Espacios con presencia y personalidad únicas.',
                color: 'from-football-blue to-football-purple'
              },
              {
                icon: Trophy,
                title: 'Evolución Continua',
                description: 'Tus NFTs evolucionan: juegan, suben de nivel y mejoran rendimiento. Cada partida los hace más valiosos.',
                color: 'from-football-purple to-football-orange'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="game-card text-center group"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Player Packs Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-dark-400/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
                ¡Cajas Sorpresa!
              </h2>
              <p className="text-gray-400 text-lg">
                Tu acceso directo a los tiradores más potentes, precisos y valiosos del juego
              </p>
            </div>
            
            <Link to="/shop" className="btn-outline hidden md:block">
              Ver Todas las Cajas
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-dark rounded-xl p-6 mb-8 text-center"
          >
            <p className="text-gray-300 text-lg leading-relaxed">
              Las Cajas Sorpresa son tu acceso directo a los tiradores más potentes del juego. 
              Abre cajas de <span className="text-gray-400 font-semibold">Tercera</span>, 
              <span className="text-blue-400 font-semibold"> Segunda</span> o 
              <span className="text-yellow-400 font-semibold"> Primera División</span> y descubre personajes únicos 
              con habilidades especiales que no solo aumentan tus chances de anotar... 
              <span className="text-football-green font-semibold">sino también tus ganancias en tokens por cada victoria.</span>
            </p>
            <p className="text-football-blue font-semibold text-xl mt-4">
              Cada división tiene 5 niveles de dificultad y precio. 
              ¿Y si hoy te toca ese personaje legendario que todos quieren?
            </p>
          </motion.div>

          {productsLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" text="Loading player packs..." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products?.slice(0, 3).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="game-card group cursor-pointer relative overflow-hidden"
                >
                  <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${
                    index === 0 ? 'bg-gray-500/20 text-gray-400' :
                    index === 1 ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {index === 0 ? 'TERCERA' : index === 1 ? 'SEGUNDA' : 'PRIMERA'}
                  </div>
                  
                  <div className={`aspect-square bg-gradient-to-br ${
                    index === 0 ? 'from-gray-400/20 to-gray-600/20' :
                    index === 1 ? 'from-blue-400/20 to-blue-600/20' :
                    'from-yellow-400/20 to-orange-500/20'
                  } rounded-lg mb-4 flex items-center justify-center`}>
                    <div className={`w-20 h-20 bg-gradient-to-r ${
                      index === 0 ? 'from-gray-400 to-gray-600' :
                      index === 1 ? 'from-blue-400 to-blue-600' :
                      'from-yellow-400 to-orange-500'
                    } rounded-full flex items-center justify-center`}>
                      <Trophy className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{product.description}</p>
                  <Link to="/shop" className="btn-primary w-full">
                    Abrir Caja
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 md:hidden"
          >
            <Link to="/shop" className="btn-outline">
              Ver Todas las Cajas
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Equipment & Upgrades Section */}
      <section className="py-20 bg-gradient-to-b from-dark-400/30 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              Botas, Pelotas, Bebidas Energéticas
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              ¿Quieres dominar el campo y convertir a tu jugador en una verdadera leyenda?
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {[
              {
                icon: "👟",
                title: "Botas Especiales",
                description: "Potencian la fuerza de disparo y precisión de tus penales",
                benefit: "+15% Potencia de Disparo"
              },
              {
                icon: "⚽",
                title: "Pelotas Premium",
                description: "Afinan la precisión y control del balón en momentos decisivos",
                benefit: "+20% Precisión"
              },
              {
                icon: "🥤",
                title: "Bebidas Energéticas",
                description: "Maximizan el rendimiento y resistencia de tus jugadores",
                benefit: "+25% Rendimiento"
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="game-card text-center group"
              >
                <div className="text-6xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 mb-4">{item.description}</p>
                <div className="text-football-green font-semibold">{item.benefit}</div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-dark rounded-xl p-8 text-center"
          >
            <p className="text-gray-300 text-lg mb-4">
              Cada objeto mejora no solo su desempeño en el juego, sino también tus ganancias: 
              <span className="text-football-green font-semibold">más goles, más victorias, más tokens.</span>
            </p>
            <p className="text-football-blue font-semibold text-xl">
              En Goal Play, los campeones no solo se entrenan... se equipan con inteligencia.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Farming Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              Farming - ¡Eleva el nivel de tus jugadores!
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              En Goal Play, el talento se construye día a día
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-gray-300 text-lg">
                Antes de lanzar su primer penalti, tus jugadores deberán prepararse a fondo. 
                A través de un sistema de farming inteligente, donde entrenan diariamente para mejorar 
                sus estadísticas hasta alcanzar el máximo rendimiento.
              </p>
              
              <div className="space-y-4">
                {[
                  { skill: "Precisión", description: "Mejora la puntería exacta al momento de patear", color: "text-football-green" },
                  { skill: "Acrobacia", description: "Aumenta su agilidad, estilo y control", color: "text-football-blue" },
                  { skill: "Potencia", description: "Incrementa fuerza y capacidad de ejecución", color: "text-football-orange" }
                ].map((skill, index) => (
                  <div key={skill.skill} className="flex items-center space-x-4 p-4 glass rounded-lg">
                    <div className={`w-12 h-12 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className={`font-semibold ${skill.color}`}>{skill.skill}</h4>
                      <p className="text-gray-400 text-sm">{skill.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="glass-dark rounded-xl p-6">
                <p className="text-football-green font-semibold text-lg mb-2">
                  ⚠️ Regla Importante:
                </p>
                <p className="text-gray-300">
                  Solo cuando un jugador alcance el 100% de entrenamiento, podrá ser alineado en el primer juego oficial de penaltis. 
                  Si no está listo, no podrá entrar al campo.
                </p>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="glass-dark rounded-2xl p-8">
                <div className="w-32 h-32 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-5xl">🏃‍♂️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  Entrena, Mejora, Domina
                </h3>
                <p className="text-gray-300 mb-6">
                  Esto no es solo entrenar, es formar leyendas.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Precisión:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-football-green to-football-blue h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <span className="text-white text-sm">75%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Acrobacia:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-football-blue to-football-purple h-2 rounded-full" style={{ width: '60%' }}></div>
                      </div>
                      <span className="text-white text-sm">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Potencia:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-football-purple to-football-orange h-2 rounded-full" style={{ width: '90%' }}></div>
                      </div>
                      <span className="text-white text-sm">90%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Staking Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-dark-400/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              Staking - Genera beneficios con tu token GOAL
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Haz que tus tokens trabajen por ti, genera ingresos pasivos y fortalece tu presencia dentro de Goal Play
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-dark rounded-2xl p-8"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl">💰</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Staking GOAL
                </h3>
                <p className="text-football-green font-semibold text-lg">
                  Gana el doble en las primeras 4 semanas
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 glass rounded-lg">
                  <span className="text-gray-400">APY Inicial:</span>
                  <span className="text-football-green font-bold text-xl">25%</span>
                </div>
                <div className="flex justify-between items-center p-3 glass rounded-lg">
                  <span className="text-gray-400">APY Estándar:</span>
                  <span className="text-white font-bold">12.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 glass rounded-lg">
                  <span className="text-gray-400">Período Doble:</span>
                  <span className="text-football-blue font-bold">4 Semanas</span>
                </div>
              </div>
              
              <button className="w-full btn-primary mt-6">
                Comenzar Staking
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <p className="text-gray-300 text-lg">
                Durante las primeras 4 semanas desde el lanzamiento del staking, los usuarios que pongan 
                sus tokens en staking recibirán el doble de recompensas.
              </p>
              
              <p className="text-gray-300 text-lg">
                Después de ese período, las tasas de ganancia se ajustarán de forma lineal garantizando 
                la sostenibilidad a largo plazo del ecosistema.
              </p>
              
              <div className="glass rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-4">Beneficios del Staking:</h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-center space-x-2">
                    <span className="text-football-green">✓</span>
                    <span>Ingresos pasivos garantizados</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-football-green">✓</span>
                    <span>Fortalece el ecosistema Goal Play</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-football-green">✓</span>
                    <span>Acceso a eventos exclusivos</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-football-green">✓</span>
                    <span>Poder de voto en decisiones</span>
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Multi-Chain Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              BSC Primero, Expansión Multi-Cadena Después
            </h2>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto">
              Toda gran historia comienza en una cancha... y la nuestra es Binance Smart Chain
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { name: "BSC", status: "Activo", color: "from-yellow-400 to-orange-500", icon: "🟡" },
              { name: "Ethereum", status: "Próximo", color: "from-blue-400 to-purple-500", icon: "🔷" },
              { name: "Solana", status: "Próximo", color: "from-purple-400 to-pink-500", icon: "🟣" },
              { name: "Avalanche", status: "Próximo", color: "from-red-400 to-pink-500", icon: "🔴" }
            ].map((chain, index) => (
              <motion.div
                key={chain.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="game-card text-center"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${chain.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <span className="text-2xl">{chain.icon}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{chain.name}</h3>
                <div className={`text-sm font-semibold ${
                  chain.status === 'Activo' ? 'text-football-green' : 'text-gray-400'
                }`}>
                  {chain.status}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-dark rounded-xl p-8 text-center"
          >
            <p className="text-gray-300 text-lg mb-4">
              Rápida, económica y perfecta para el gaming Web3, BSC es el lugar ideal para que Goal Play inicie su camino. 
              Pero nuestro objetivo es mucho más grande: queremos que lleves a tus personajes, logros y recompensas más allá.
            </p>
            <p className="text-football-blue font-semibold text-xl">
              La comunidad de Goal Play tendrá la potestad de decidir en qué blockchain se lanzará nuestro token.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Leaderboard Preview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              Comunidad Goal Play
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              La verdadera magia de nuestro proyecto reside en su gente, en la comunidad apasionada Goal Play
            </p>
          </motion.div>

          {leaderboardLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" text="Loading leaderboard..." />
            </div>
          ) : (
            <div className="glass-dark rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="space-y-4">
                  {leaderboard?.slice(0, 5).map((player, index) => (
                    <motion.div
                      key={player.userId}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 glass rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                          index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' :
                          'bg-gradient-to-r from-football-green to-football-blue'
                        } text-white`}>
                          {player.rank}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{player.username}</div>
                          <div className="text-sm text-gray-400">{player.wins} wins • {player.winRate}% win rate</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-football-green">${player.rewards}</div>
                        <div className="text-sm text-gray-400">rewards</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="p-6 border-t border-white/10 text-center">
                <Link to="/leaderboard" className="btn-primary">
                  View Full Leaderboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Add GOAL Token Section */}
      <section className="py-20 bg-gradient-to-b from-transparent to-dark-400/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
              Connect Your Wallet & Get GOAL Token
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Connect your wallet and add the official GOAL token to be ready for the ecosystem
            </p>
          </motion.div>

          {/* Wallet Connection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="glass-dark rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-4">
                Paso 1: Conecta tu Wallet
              </h3>
              <p className="text-gray-400 mb-6">
                Conecta tu wallet MetaMask para empezar a jugar y ganar recompensas
              </p>
              <div className="flex justify-center">
                <WalletConnect size="lg" />
              </div>
            </div>
          </motion.div>

          {/* Add Token */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="glass-dark rounded-xl p-8">
              <h3 className="text-xl font-semibold text-white mb-4 text-center">
                Paso 2: Añadir Token GOAL
              </h3>
              <AddToMetaMask showTitle={false} size="lg" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-dark rounded-2xl p-8 md:p-12 text-center relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-r from-football-green via-football-blue to-football-purple" />
            </div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-4">
                Ready to Become a Football Legend?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Join the ultimate football gaming experience and start earning rewards today
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/game" className="btn-primary flex items-center space-x-2">
                  <span>Start Playing Now</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                
                <Link to="/shop" className="btn-outline">
                  Get Player Packs
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* API Status */}
      {apiInfo && (
        <section className="py-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <p className="text-gray-400 text-sm">
                Connected to {apiInfo.name} • Status: {apiInfo.status} • 
                <span className="text-football-green ml-1">Live Data</span>
              </p>
            </motion.div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;