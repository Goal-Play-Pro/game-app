import React from 'react';
import { motion } from 'framer-motion';
import { Users, Target, Globe, Zap, Shield, Heart, Trophy, Star } from 'lucide-react';

const AboutPage = () => {
  const teamValues = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Pasión por el Fútbol",
      description: "Crecimos pateando pelotas en las calles, soñando con estadios llenos y goles legendarios"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Innovación Tecnológica", 
      description: "Fascinados por el mundo cripto, vimos la oportunidad de unir fútbol con blockchain"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Comunidad Primero",
      description: "Creemos que la verdadera magia reside en la gente y la comunidad apasionada"
    },
    {
      icon: <Trophy className="w-8 h-8" />,
      title: "Excelencia en Gaming",
      description: "Cada fan se convierte en protagonista de su propio juego con recompensas reales"
    }
  ];

  const milestones = [
    {
      year: "2024",
      title: "El Inicio",
      description: "Un grupo de amigos se reúne en un bar para hablar de fútbol y vida",
      status: "completed"
    },
    {
      year: "2025",
      title: "La Visión",
      description: "Nace la idea: ¿Y qué pasa si uno junta el fútbol con tecnología blockchain?",
      status: "completed"
    },
    {
      year: "2025",
      title: "Goal Play",
      description: "Desarrollo completo de la plataforma de gaming con NFTs y blockchain",
      status: "in-progress"
    },
    {
      year: "2026",
      title: "Metaverso",
      description: "Lanzamiento del metaverso Goal Play con experiencias VR inmersivas",
      status: "planned"
    }
  ];

  return (
    <div className="pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-display font-bold gradient-text mb-6">
            Quiénes Somos
          </h1>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Somos un equipo apasionado por la tecnología y, especialmente, por el deporte rey, el fútbol. 
            Hemos unido estas dos pasiones para crear un proyecto innovador de earn-to-play en el mundo de las criptomonedas.
          </p>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-dark rounded-2xl p-8 mb-16 text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
            Nuestra Misión
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Revolucionar la forma en que los aficionados interactúan con el fútbol, 
            ofreciendo una experiencia única donde la diversión se combina con oportunidades de ganancia.
          </p>
        </motion.div>

        {/* Genesis Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text text-center mb-12">
            El Génesis Virtual
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
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
            </div>
            
            <div className="relative">
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
            </div>
          </div>
        </motion.div>

        {/* Team Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text text-center mb-12">
            Nuestros Valores
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamValues.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="game-card text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-gray-400 text-sm">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text text-center mb-12">
            Nuestra Historia
          </h2>
          
          <div className="relative">
            <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-1 h-full bg-gradient-to-b from-football-green to-football-blue rounded-full" />
            
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 -translate-y-1/2 top-1/2">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                    milestone.status === 'completed' ? 'bg-gradient-to-r from-football-green to-football-blue' :
                    milestone.status === 'in-progress' ? 'bg-gradient-to-r from-football-blue to-football-purple' :
                    'bg-gradient-to-r from-gray-400 to-gray-600'
                  }`}>
                    <span className="text-white font-bold text-lg">{milestone.year}</span>
                  </div>
                </div>

                <div className={`w-full md:w-5/12 ml-24 md:ml-0 ${
                  index % 2 === 0 ? 'md:mr-auto md:pr-16' : 'md:ml-auto md:pl-16'
                }`}>
                  <div className="glass-dark rounded-xl p-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-gray-300">
                      {milestone.description}
                    </p>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-3 ${
                      milestone.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      milestone.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {milestone.status === 'completed' ? 'Completado' :
                       milestone.status === 'in-progress' ? 'En Progreso' :
                       'Planificado'}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Team Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text text-center mb-12">
            Nuestro Equipo
          </h2>
          
          <div className="glass-dark rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">
              Core Team Anónimo
            </h3>
            
            <p className="text-gray-300 text-lg leading-relaxed max-w-3xl mx-auto mb-6">
              En esta etapa inicial, hemos decidido mantener la identidad de nuestro Core Team en el anonimato. 
              Esta decisión estratégica nos permite centrarnos por completo en el desarrollo del proyecto y en la 
              construcción de una base sólida para nuestra comunidad.
            </p>
            
            <div className="glass rounded-xl p-6 max-w-2xl mx-auto">
              <h4 className="text-lg font-semibold text-football-green mb-3">
                🎯 Compromiso de Transparencia
              </h4>
              <p className="text-gray-300 mb-4">
                Creemos firmemente en la transparencia y en el compromiso con nuestros usuarios. 
                Por ello, nos comprometemos a revelar la identidad de nuestro CEO cuando alcancemos:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-football-green/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-football-green mb-1">$20M</div>
                  <div className="text-sm text-gray-400">Market Cap</div>
                </div>
                <div className="bg-football-blue/20 rounded-lg p-4">
                  <div className="text-2xl font-bold text-football-blue mb-1">10K</div>
                  <div className="text-sm text-gray-400">Usuarios Activos</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Community Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text text-center mb-12">
            Comunidad Goal Play
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-gray-300 text-lg leading-relaxed">
                La verdadera magia de nuestro proyecto reside en su gente, en la comunidad apasionada Goal Play. 
                Siente la conexión genuina con otros miembros que comparten tu amor por la estrategia, 
                la competencia y la emoción del gol.
              </p>
              
              <div className="glass rounded-xl p-6">
                <h3 className="text-xl font-bold text-football-green mb-4">
                  Tu Clan, Tu Legado, Tus Recompensas
                </h3>
                <p className="text-gray-300">
                  Participa en campeonatos electrizantes contra otras comunidades de Influencers. 
                  Estos torneos no solo son un escaparate de destreza, sino también una vía directa 
                  a premios que superan las expectativas, construyendo un legado compartido.
                </p>
              </div>
              
              <div className="text-center">
                <p className="text-football-blue font-semibold text-xl mb-6">
                  ¡Sé parte de una comunidad que está marcando la diferencia!
                </p>
                
                <div className="flex justify-center space-x-4">
                  {[
                    { name: 'Telegram', icon: '📱', color: 'from-blue-500 to-cyan-500' },
                    { name: 'Twitter (X)', icon: '🐦', color: 'from-blue-400 to-blue-600' },
                    { name: 'Instagram', icon: '📸', color: 'from-pink-500 to-purple-500' },
                    { name: 'TikTok', icon: '🎵', color: 'from-black to-gray-800' }
                  ].map((social, index) => (
                    <motion.button
                      key={social.name}
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-12 h-12 bg-gradient-to-r ${social.color} rounded-full flex items-center justify-center text-white text-xl`}
                    >
                      {social.icon}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-football-green/20 to-football-blue/20 rounded-2xl p-8 glass-dark">
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    Únete a la Revolución
                  </h3>
                  <p className="text-gray-300">
                    Forma parte de la comunidad que está redefiniendo el futuro del gaming deportivo
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="glass rounded-lg p-3">
                      <div className="text-football-green font-bold text-lg">7.5K+</div>
                      <div className="text-gray-400">Miembros</div>
                    </div>
                    <div className="glass rounded-lg p-3">
                      <div className="text-football-blue font-bold text-lg">24/7</div>
                      <div className="text-gray-400">Activa</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Vision Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text text-center mb-12">
            Nuestra Visión
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="game-card text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Global</h3>
              <p className="text-gray-400">
                Crear una plataforma global donde cualquier fan del fútbol pueda participar y ganar
              </p>
            </div>
            
            <div className="game-card text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-football-blue to-football-purple rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Innovadora</h3>
              <p className="text-gray-400">
                Pioneros en la fusión de gaming deportivo con tecnología blockchain
              </p>
            </div>
            
            <div className="game-card text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-football-purple to-football-orange rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Sostenible</h3>
              <p className="text-gray-400">
                Economía de tokens diseñada para el crecimiento a largo plazo
              </p>
            </div>
          </div>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-dark rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-display font-bold gradient-text mb-4">
            ¿Listo para Hacer Historia?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
            Únete a Goal Play y sé parte de la revolución que está transformando 
            la forma en que vivimos el fútbol digital
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/game" className="btn-primary flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Comenzar a Jugar</span>
            </a>
            
            <a href="/whitepaper" className="btn-outline flex items-center space-x-2">
              <Globe className="w-5 h-5" />
              <span>Leer Whitepaper</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;