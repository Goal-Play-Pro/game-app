/**
 * AI Knowledge Service - Base de conocimiento completa de Goal Play
 * Contiene TODA la información del ecosistema para el agente AI
 */

export class AIKnowledgeService {
  
  // 🎮 CONOCIMIENTO COMPLETO DEL JUEGO
  static readonly GAME_MECHANICS = {
    penalty_system: {
      description: 'Sistema determinístico de penalty shootout basado en stats reales',
      formula: 'sumSubstats / maxStats * (maxPercentage - startingPercentage) + startingPercentage',
      factors: ['Stats del jugador', 'División', 'Dirección elegida', 'Potencia del disparo', 'Dirección del portero'],
      probability_ranges: {
        primera: '50% inicial → 90% máximo',
        segunda: '40% inicial → 80% máximo', 
        tercera: '30% inicial → 70% máximo'
      },
      gameplay_flow: [
        'Seleccionar jugador entrenado (nivel 5+ y 500 XP)',
        'Elegir modo: Single Player vs IA o Multiplayer PvP',
        'Configurar partida: 3-10 rondas',
        'Ejecutar penalties: dirección + potencia',
        'Recibir recompensas: XP + tokens GOAL'
      ]
    },

    player_progression: {
      levels: 'Del 1 al 100 con experiencia acumulativa',
      farming_system: 'Entrenamiento obligatorio antes de competir',
      requirements: 'Nivel 5 mínimo + 500 XP para jugar',
      bonuses: 'Cada 5 niveles = +1 a todas las estadísticas',
      experience_sources: [
        'Goles anotados: +10 XP',
        'Fallos: +2 XP', 
        'Victorias: +50 XP',
        'Juego perfecto: +100 XP',
        'Sesiones de farming: +25 XP'
      ]
    },

    divisions_detailed: {
      primera: {
        players: ['Lionel Messi', 'Cristiano Ronaldo', 'Kylian Mbappé', 'Erling Haaland', 'Vinicius Junior'],
        stats_range: '95 inicial → 171 máximo',
        probability: '50% → 90%',
        prices: 'Nivel 1: $1,000 → Nivel 5: $5,000 USDT',
        description: 'División de élite para gamers profesionales',
        target_audience: 'Jugadores experimentados con presupuesto alto'
      },
      segunda: {
        players: ['Cole Palmer', 'Florian Wirtz', 'Julian Alvarez', 'Achraf Hakimi', 'Alphonso Davies'],
        stats_range: '76 inicial → 152 máximo',
        probability: '40% → 80%',
        prices: 'Nivel 1: $200 → Nivel 5: $850 USDT',
        description: 'División intermedia balanceada',
        target_audience: 'Jugadores con experiencia moderada'
      },
      tercera: {
        players: ['Jugadores emergentes', 'Talentos jóvenes', 'Promesas del fútbol'],
        stats_range: '57 inicial → 133 máximo',
        probability: '30% → 70%',
        prices: 'Nivel 1: $30 → Nivel 5: $130 USDT',
        description: 'División inicial perfecta para comenzar',
        target_audience: 'Nuevos jugadores y presupuestos ajustados'
      }
    }
  };

  // 💰 SISTEMA ECONÓMICO COMPLETO
  static readonly ECONOMY_SYSTEM = {
    token_goal: {
      contract_address: '0x1e2ceb5d2b4ed8077456277ba5309f950aef2ce4',
      symbol: 'GOAL',
      decimals: 7,
      total_supply: '1,000,000,000',
      blockchain: 'Binance Smart Chain (BSC)',
      distribution: {
        play_to_earn: '30% - Recompensas para jugadores',
        community: '15% - Incentivos comunitarios',
        marketing: '10% - Promoción y crecimiento',
        liquidity: '10% - Liquidez DEX y CEX',
        burning: '10% - Mecanismo deflacionario',
        developers: '10% - Equipo de desarrollo',
        treasury: '5% - Reservas del proyecto',
        public_sale: '8% - Venta pública',
        private_sale: '2% - Inversores privados'
      }
    },

    staking_system: {
      initial_apy: '25% APY primeras 4 semanas',
      standard_apy: '12.5% APY después',
      benefits: [
        'Ingresos pasivos garantizados',
        'Acceso a eventos exclusivos', 
        'Poder de voto en decisiones',
        'Descuentos en tienda',
        'Bonificaciones especiales'
      ]
    },

    pricing_strategy: {
      tercera_division: {
        nivel_1: '$30 USDT',
        nivel_2: '$58 USDT',
        nivel_3: '$84 USDT', 
        nivel_4: '$108 USDT',
        nivel_5: '$130 USDT'
      },
      segunda_division: {
        nivel_1: '$200 USDT',
        nivel_2: '$380 USDT',
        nivel_3: '$555 USDT',
        nivel_4: '$710 USDT', 
        nivel_5: '$850 USDT'
      },
      primera_division: {
        nivel_1: '$1,000 USDT',
        nivel_2: '$1,900 USDT',
        nivel_3: '$2,775 USDT',
        nivel_4: '$3,600 USDT',
        nivel_5: '$5,000 USDT'
      }
    },

    referral_system: {
      commission_rate: '5% de por vida',
      payment_method: 'Automático en USDT',
      tracking: 'Tiempo real con dashboard completo',
      examples: [
        'Amigo compra $1,000 → Tú ganas $50',
        'Amigo compra $200 → Tú ganas $10', 
        'Amigo compra $30 → Tú ganas $1.50'
      ]
    }
  };

  // 🏗️ ARQUITECTURA TÉCNICA
  static readonly TECHNICAL_ARCHITECTURE = {
    backend: {
      framework: 'NestJS con TypeScript',
      database: 'Supabase + JSON híbrido',
      endpoints: '40+ endpoints REST documentados',
      authentication: 'Multi-wallet con SIWE y Solana',
      security: 'JWT, RLS, Rate Limiting, Audit Logging',
      scalability: 'Preparado para millones de usuarios concurrentes',
      modules: [
        'AuthModule - Autenticación multi-chain',
        'WalletModule - Gestión de wallets múltiples',
        'ShopModule - Catálogo y productos',
        'OrderModule - Órdenes y pagos',
        'GachaModule - Sistema de draws',
        'InventoryModule - Jugadores y progresión',
        'PenaltyModule - Motor de gameplay',
        'LedgerModule - Contabilidad doble entrada',
        'ReferralModule - Sistema de referidos'
      ]
    },

    frontend: {
      framework: 'React 18 + TypeScript + Vite',
      styling: 'TailwindCSS con diseño responsive',
      animations: 'Framer Motion para UX premium',
      state_management: 'React Query para cache inteligente',
      web3_integration: 'MetaMask, WalletConnect, Multi-chain',
      pages: [
        'HomePage - Landing y estadísticas',
        'GamePage - Penalty shootout',
        'ShopPage - Marketplace de packs',
        'InventoryPage - Gestión de jugadores',
        'ProfilePage - Perfil y estadísticas',
        'LeaderboardPage - Rankings globales'
      ]
    },

    blockchain: {
      primary_chain: 'Binance Smart Chain (BSC)',
      future_chains: ['Ethereum', 'Solana', 'Polygon', 'Arbitrum'],
      payment_tokens: 'USDT multi-chain',
      smart_contracts: 'Estadísticas y leaderboard on-chain',
      wallets_supported: ['MetaMask', 'Trust Wallet', 'WalletConnect'],
      gas_optimization: 'Batch operations y efficient storage'
    }
  };

  // 📊 DATOS Y ESTADÍSTICAS
  static readonly ECOSYSTEM_DATA = {
    database_schema: {
      total_tables: 20,
      main_entities: [
        'users - Perfiles de usuarios',
        'wallets - Wallets vinculadas', 
        'products - Catálogo de productos',
        'orders - Órdenes y pagos',
        'owned_players - Inventario NFT',
        'penalty_sessions - Partidas de penalty',
        'ledger_entries - Contabilidad completa',
        'referral_codes - Sistema de referidos'
      ],
      estimated_volume: '4+ millones de registros con 10K usuarios activos'
    },

    api_endpoints: {
      authentication: 4,
      wallet_management: 4,
      shop_catalog: 4,
      order_processing: 5,
      gacha_system: 3,
      inventory_management: 4,
      penalty_gameplay: 5,
      accounting_ledger: 2,
      referral_system: 7,
      system_monitoring: 4,
      total: '40+ endpoints completamente documentados'
    },

    real_players_data: {
      total_players: 16,
      legendary: ['Almost Messi', 'Cristiano Fernaldo', 'Kalyan Mbappi', 'Sinedine Sidini'],
      epic: ['Vini', 'Laminate Yumal', 'Newmar', 'Allaison Baker', 'Achraf Hakimi'],
      rare: ['Flor Wir', 'Willsa', 'July', 'William Saliba'],
      uncommon: ['Colpam', 'Emili Mar'],
      positions: {
        forwards: 6,
        midfielders: 3, 
        defenders: 5,
        goalkeepers: 2
      }
    }
  };

  // 🎯 ESTRATEGIAS Y CONSEJOS
  static readonly STRATEGIES_AND_TIPS = {
    for_beginners: [
      'Empieza con Tercera División para aprender mecánicas',
      'Entrena tu jugador hasta nivel 5 antes de competir',
      'Practica en Single Player antes de PvP',
      'Crea tu código de referido inmediatamente',
      'Conecta MetaMask y añade token GOAL'
    ],

    for_intermediate: [
      'Considera Segunda División para mejor balance precio/performance',
      'Diversifica tu colección con diferentes posiciones',
      'Participa en multiplayer para mayores recompensas',
      'Optimiza tu farming para maximizar XP',
      'Comparte tu código de referido estratégicamente'
    ],

    for_advanced: [
      'Invierte en Primera División para máximas ganancias',
      'Domina la fórmula de probabilidad para estrategia',
      'Construye equipo balanceado para diferentes situaciones',
      'Maximiza staking durante período de doble recompensas',
      'Lidera comunidades para referidos masivos'
    ],

    earning_strategies: [
      'Juega diariamente para recompensas consistentes',
      'Invita amigos para comisiones del 5%',
      'Participa en staking para ingresos pasivos',
      'Sube de nivel jugadores para mejor performance',
      'Participa en eventos especiales y torneos'
    ]
  };

  // 🗣️ VARIACIONES DE LENGUAJE NATURAL
  static readonly CONVERSATION_VARIATIONS = {
    greetings: [
      '¡Hola, futbolero!', '¡Hey, campeón!', '¡Bienvenido!', '¡Qué tal, crack!',
      '¡Hola, leyenda!', '¡Saludos, gamer!', '¡Hola, champion!'
    ],
    
    excitement: [
      '¡Increíble!', '¡Genial!', '¡Perfecto!', '¡Excelente!', '¡Fantástico!',
      '¡Brutal!', '¡Espectacular!', '¡Impresionante!', '¡Magnífico!'
    ],
    
    transitions: [
      'Por cierto,', 'Además,', 'También,', 'Y otra cosa,', 'Ah, y',
      'No olvides que', 'Ten en cuenta que', 'Es importante mencionar que'
    ],
    
    encouragement: [
      '¡Vas por buen camino!', '¡Excelente elección!', '¡Perfecto!',
      '¡Esa es la actitud!', '¡Así se hace!', '¡Muy inteligente!'
    ],

    call_to_action: [
      '¿Te animas?', '¿Qué dices?', '¿Empezamos?', '¿Te parece?',
      '¿Listo para la acción?', '¿Vamos por ello?', '¿Qué opinas?'
    ]
  };

  // 📈 DATOS EN TIEMPO REAL SIMULADOS
  static readonly LIVE_DATA_TEMPLATES = {
    user_stats: () => ({
      totalUsers: Math.floor(Math.random() * 3000) + 7000,
      activeUsers: Math.floor(Math.random() * 500) + 700,
      totalGames: Math.floor(Math.random() * 10000) + 35000,
      totalRewards: (Math.random() * 200000 + 800000).toFixed(2),
      topPlayer: 'Player#' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
      currentPrice: (Math.random() * 0.5 + 0.1).toFixed(4),
      marketCap: (Math.random() * 5000000 + 15000000).toFixed(0)
    }),

    market_activity: () => ({
      recentPurchases: Math.floor(Math.random() * 50) + 20,
      popularPack: ['Pack Primera Nivel 1', 'Pack Segunda Nivel 3', 'Pack Tercera Nivel 5'][Math.floor(Math.random() * 3)],
      averageSession: (Math.random() * 5 + 6).toFixed(1) + ' minutos',
      peakHours: '20:00-22:00 UTC',
      conversionRate: (Math.random() * 5 + 10).toFixed(1) + '%'
    })
  };

  // 🎯 RESPUESTAS CONTEXTUALES INTELIGENTES
  static getContextualResponse(topic: string, userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'): string {
    const responses = {
      penalty_mechanics: {
        beginner: `¡El sistema de penalty es súper emocionante! ⚽

🎯 **Cómo Funciona**:
Cada jugador tiene 5 estadísticas: velocidad, tiro, pase, defensa y portería. La suma de estas stats determina tu probabilidad de anotar.

📊 **Por División**:
- Tercera: 30%-70% probabilidad
- Segunda: 40%-80% probabilidad  
- Primera: 50%-90% probabilidad

🎮 **En el Juego**:
1. Eliges dirección (izquierda, centro, derecha)
2. Ajustas potencia (0-100%)
3. ¡El sistema calcula si es gol!

¿Te gustaría saber más sobre alguna división específica? 🚀`,

        intermediate: `¡Perfecto! Te explico la mecánica avanzada del penalty 🎯

🧮 **Fórmula Canónica**:
- Suma substats (sin overall): speed + shooting + passing + defending + goalkeeping
- Ratio = substats / maxStats de la división
- Probabilidad = startingPercentage + (maxPercentage - startingPercentage) × ratio
- Clamp final entre 5% y 95%

⚡ **Factores Modificadores**:
- Potencia < 50%: -20% efectividad (muy suave)
- Potencia > 90%: -40% efectividad (muy fuerte, menos control)
- Dirección = Portero: -70% efectividad (portero adivina)

🎲 **Determinismo**: Mismo seed = mismo resultado. ¡Totalmente justo!

¿Quieres estrategias para maximizar tu probabilidad? 💡`,

        advanced: `¡Excelente! Aquí tienes el análisis técnico completo 🔬

📐 **Implementación Exacta**:
\`\`\`
sumSubstats = speed + shooting + passing + defending + goalkeeping
ratio = clamp(sumSubstats / maxStats, 0, 1)
chance = floor(clamp(startingPercentage + (maxPercentage - startingPercentage) * ratio, 5, 95))
roll = floor(rng * 100) + 1  // [1..100]
isGoal = roll <= chance
\`\`\`

🎯 **Optimización Estratégica**:
- Primera División: Necesitas 171 stats para 90% probabilidad
- Progresión óptima: +1 stat cada 5 niveles
- ROI máximo: Jugadores legendarios en Primera División
- Meta-game: Farming eficiente vs tiempo de juego

¿Quieres que analicemos tu estrategia de inversión? 📊`
      },

      tokenomics: {
        beginner: `¡El token GOAL es el corazón de todo! 💎

🪙 **Datos Básicos**:
- Símbolo: GOAL
- Cantidad: 1,000,000,000 tokens
- Red: Binance Smart Chain (BSC)
- Contrato: 0x1e2ceb5d2b4ed8077456277ba5309f950aef2ce4

💰 **Para Qué Sirve**:
- Comprar packs de jugadores NFT
- Recibir recompensas por victorias
- Hacer staking para ingresos pasivos
- Votar en decisiones del proyecto

🚀 **Oportunidad Única**:
¡Las primeras 4 semanas de staking dan DOBLE recompensas! Después se ajusta para sostenibilidad.

¿Quieres que te ayude a añadirlo a MetaMask? 🦊`,

        intermediate: `¡Perfecto! Te explico la economía completa de GOAL 📈

💎 **Distribución Inteligente**:
- 45% para jugadores (Play-to-Earn + Community)
- 20% para crecimiento (Marketing + Liquidez)
- 10% para burning (mecanismo deflacionario)
- 25% para desarrollo y operaciones

🔥 **Mecanismo Deflacionario**:
10% del supply se quema sistemáticamente, reduciendo oferta y aumentando valor a largo plazo.

📊 **Staking Detallado**:
- Semanas 1-4: 25% APY (doble recompensas)
- Después: 12.5% APY estándar
- Beneficios extra: Acceso VIP, descuentos, governance

¿Te interesa la estrategia de staking o prefieres saber sobre utility? 💰`,

        advanced: `¡Excelente! Análisis económico profundo de GOAL 🧠

📊 **Tokenomics Avanzados**:
- Velocity controlada con staking incentives
- Burn rate ajustable según adoption metrics
- Multi-chain expansion decidida por governance
- Utility expansion con cada fase del roadmap

💹 **Modelos de Valor**:
- P2E Demand: Más jugadores = más demanda de GOAL
- Staking Lock: Reduce supply circulante
- Burn Mechanism: Presión deflacionaria constante
- Network Effects: Referrals crean viral growth

🎯 **Investment Thesis**:
- Gaming sector: $180B+ market
- P2E growth: 2000%+ en 2 años
- Football passion: 4B+ fans globally
- BSC efficiency: Low fees, high throughput

¿Analizamos el potential price action o prefieres utility roadmap? 📈`
      }
    };

    return responses[topic]?.[userLevel] || this.getDefaultResponse();
  }

  // 🎨 GENERADOR DE RESPUESTAS DINÁMICAS
  static generateDynamicResponse(topic: string, context?: any): string {
    const greeting = this.CONVERSATION_VARIATIONS.greetings[Math.floor(Math.random() * this.CONVERSATION_VARIATIONS.greetings.length)];
    const excitement = this.CONVERSATION_VARIATIONS.excitement[Math.floor(Math.random() * this.CONVERSATION_VARIATIONS.excitement.length)];
    const transition = this.CONVERSATION_VARIATIONS.transitions[Math.floor(Math.random() * this.CONVERSATION_VARIATIONS.transitions.length)];
    
    return `${greeting} ${excitement} ${transition} [contenido específico del tema]`;
  }

  // 🔍 DETECTOR DE INTENCIONES
  static detectUserIntent(message: string): {
    intent: string;
    confidence: number;
    entities: string[];
    suggestions: string[];
  } {
    const intents = {
      learn_gameplay: ['cómo jugar', 'penalty', 'mecánica', 'funciona'],
      buy_players: ['comprar', 'pack', 'precio', 'costo', 'adquirir'],
      understand_economy: ['token', 'GOAL', 'precio', 'staking', 'ganar dinero'],
      get_started: ['empezar', 'comenzar', 'inicio', 'start', 'nuevo'],
      referral_info: ['referido', 'invitar', 'comisión', 'amigos'],
      technical_info: ['tecnología', 'blockchain', 'smart contract', 'código']
    };

    // Análisis simple de intención
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => message.toLowerCase().includes(keyword))) {
        return {
          intent,
          confidence: 0.8,
          entities: keywords.filter(k => message.toLowerCase().includes(k)),
          suggestions: this.getSuggestionsForIntent(intent)
        };
      }
    }

    return {
      intent: 'general',
      confidence: 0.5,
      entities: [],
      suggestions: ['¿Cómo empezar?', '¿Qué es Goal Play?', 'Explícame las divisiones']
    };
  }

  private static getSuggestionsForIntent(intent: string): string[] {
    const suggestions = {
      learn_gameplay: ['¿Cómo entrenar jugadores?', '¿Qué división elegir?', '¿Cómo funciona el farming?'],
      buy_players: ['¿Qué pack me recomiendas?', '¿Cuál es más rentable?', '¿Cómo pago?'],
      understand_economy: ['¿Cómo hacer staking?', '¿Cuándo sube el precio?', '¿Dónde comprar GOAL?'],
      get_started: ['¿Qué wallet necesito?', '¿Cuánto dinero necesito?', '¿Es seguro?'],
      referral_info: ['¿Cómo crear mi código?', '¿Cuánto gano?', '¿Cómo compartir?'],
      technical_info: ['¿Es código abierto?', '¿Qué blockchain usan?', '¿Es auditado?']
    };

    return suggestions[intent] || [];
  }

  private static getDefaultResponse(): string {
    return `¡Hola! 👋 Soy tu asistente experto en Goal Play. 

Puedo ayudarte con TODO sobre nuestro ecosistema:
🎯 Gameplay y mecánicas
💰 Economía y tokenomics  
🏆 Estrategias de inversión
🎮 Guías paso a paso

¿Qué te gustaría saber? ⚽🚀`;
  }

  // 📚 KNOWLEDGE BASE COMPLETA
  static getCompleteKnowledge(): any {
    return {
      ...this.GAME_MECHANICS,
      ...this.ECONOMY_SYSTEM,
      ...this.TECHNICAL_ARCHITECTURE,
      ...this.ECOSYSTEM_DATA,
      ...this.STRATEGIES_AND_TIPS
    };
  }
}