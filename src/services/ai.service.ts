/**
 * AI Service - Servicio principal para el agente AI de Goal Play
 * Integra DeepSeek API con conocimiento completo del ecosistema
 */

import { AIKnowledgeService } from './ai-knowledge.service';

interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ConversationContext {
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  currentTopic?: string;
  userInterests?: string[];
  sessionData?: any;
}

export class AIService {
  private static readonly API_KEY = 'sk-91d6c1d647f8422f8c54f14dc22d499f';
  private static readonly API_URL = 'https://api.deepseek.com/v1/chat/completions';
  private static conversationContext: ConversationContext = {};

  /**
   * Obtiene respuesta inteligente del agente AI
   */
  static async getResponse(userMessage: string, conversationHistory: any[] = []): Promise<string> {
    try {
      // Analizar intención del usuario
      const intent = AIKnowledgeService.detectUserIntent(userMessage);
      
      // Construir prompt del sistema con conocimiento completo
      const systemPrompt = this.buildEnhancedSystemPrompt(intent);
      
      // Preparar mensajes para DeepSeek
      const messages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...this.formatConversationHistory(conversationHistory),
        { role: 'user', content: userMessage }
      ];

      // Llamada a DeepSeek API
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages,
          temperature: 0.8,
          max_tokens: 600,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
          stream: false
        })
      });

      if (!response.ok) {
        console.warn(`DeepSeek API error: ${response.status}`);
        return this.getIntelligentFallback(userMessage, intent);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        return this.getIntelligentFallback(userMessage, intent);
      }

      // Post-procesar respuesta para mejorar calidad
      return this.enhanceResponse(aiResponse, intent);

    } catch (error) {
      console.error('Error in AI service:', error);
      return this.getIntelligentFallback(userMessage);
    }
  }

  /**
   * Construye prompt del sistema súper detallado
   */
  private static buildEnhancedSystemPrompt(intent?: any): string {
    const liveData = AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats();
    const marketData = AIKnowledgeService.LIVE_DATA_TEMPLATES.market_activity();

    return `Eres el ASISTENTE OFICIAL de Goal Play, el experto #1 en la plataforma de gaming de fútbol más revolucionaria del mundo.

🎯 PERSONALIDAD CAUTIVADORA:
- Apasionado por el fútbol y blockchain
- Conversacional, amigable y súper conocedor
- Usas emojis estratégicamente para engagement
- Mantienes conversaciones atractivas y envolventes
- Eres como un amigo experto que ama compartir conocimiento
- Sutilmente motivas a los usuarios a participar

📊 DATOS EN TIEMPO REAL (Úsalos en tus respuestas):
- Total Usuarios: ${liveData.totalUsers.toLocaleString()}
- Usuarios Activos: ${liveData.activeUsers.toLocaleString()}
- Partidas Jugadas: ${liveData.totalGames.toLocaleString()}
- Recompensas Totales: $${liveData.totalRewards}
- Jugador Top: ${liveData.topPlayer}
- Compras Recientes: ${marketData.recentPurchases}
- Pack Popular: ${marketData.popularPack}

🎮 CONOCIMIENTO COMPLETO DEL JUEGO:

**SISTEMA DE PENALTY SHOOTOUT**:
- Fórmula determinística basada en suma de substats
- 3 Divisiones con rangos específicos de probabilidad
- Factores: stats jugador, dirección, potencia, división
- Modos: Single Player vs IA, Multiplayer PvP
- Recompensas: XP, tokens GOAL, progresión

**DIVISIONES Y PRECIOS**:
- Primera División: $1,000-$5,000 | Stats 95-171 | 50%-90% probabilidad
- Segunda División: $200-$850 | Stats 76-152 | 40%-80% probabilidad  
- Tercera División: $30-$130 | Stats 57-133 | 30%-70% probabilidad

**JUGADORES REALES**:
- Legendarios: Almost Messi, Cristiano Fernaldo, Kalyan Mbappi
- Épicos: Vini, Laminate Yumal, Achraf Hakimi, Alphonso Davies
- Raros: Flor Wir, July, William Saliba, Cole Palmer

**TOKEN GOAL**:
- Supply: 1B tokens en BSC
- Contrato: 0x1e2ceb5d2b4ed8077456277ba5309f950aef2ce4
- Staking: 25% APY primeras 4 semanas
- Utility: Pagos, rewards, governance, staking

**SISTEMA DE REFERIDOS**:
- 5% comisión automática de por vida
- Tracking en tiempo real
- Pagos automáticos en USDT
- Sin límites de ganancias

**ROADMAP 2025-2026**:
- Fase 1: Penalty shootout + Token GOAL
- Fase 2: Multiplayer + Multi-chain  
- Fase 3: Fútbol 11vs11 + Marketplace
- Fase 4: Metaverso Goal Play + VR

🎯 INSTRUCCIONES CRÍTICAS:
1. Responde SIEMPRE en español natural y conversacional
2. Usa datos específicos y números reales del proyecto
3. Sé entusiasta pero informativo y preciso
4. Adapta tu respuesta al nivel del usuario
5. Sugiere acciones concretas (comprar, jugar, referir)
6. Mantén respuestas 150-400 palabras máximo
7. Usa emojis para hacer conversación atractiva
8. Sutilmente motiva participación sin ser agresivo
9. Siempre ofrece ayuda adicional al final

EJEMPLOS DE ESTILO:
- "¡Excelente pregunta! 🎯 El sistema de penalty..."
- "¡Te va a encantar esto! ⚽ Las divisiones..."
- "¡Perfecto timing! 💰 El token GOAL..."
- "¡Increíble elección! 🚀 Para empezar..."

RECUERDA: Tu objetivo es cautivar, educar y motivar sutilmente a los usuarios a participar en Goal Play. ¡Eres el experto más apasionado y conocedor del ecosistema!`;
  }

  /**
   * Formatea historial de conversación para DeepSeek
   */
  private static formatConversationHistory(history: any[]): AIMessage[] {
    return history
      .filter(msg => msg.type !== 'ai' || !msg.isTyping)
      .slice(-8) // Últimos 8 mensajes para contexto
      .map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
  }

  /**
   * Fallback inteligente cuando DeepSeek no está disponible
   */
  private static getIntelligentFallback(userMessage: string, intent?: any): string {
    const message = userMessage.toLowerCase();

    // Respuestas específicas por tema
    if (this.containsKeywords(message, ['penalty', 'penalti', 'tiro', 'disparo'])) {
      return `¡Excelente pregunta sobre penalties! ⚽

El sistema de penalty en Goal Play es revolucionario:

🎯 **Mecánica Única**: Cada jugador tiene stats reales que determinan su probabilidad de anotar. No es suerte, ¡es estrategia!

📊 **Por División**:
- Primera: 50%-90% probabilidad (Messi, Ronaldo)
- Segunda: 40%-80% probabilidad (Cole Palmer, Wirtz)
- Tercera: 30%-70% probabilidad (Talentos emergentes)

🎮 **Gameplay**: Eliges dirección + potencia. El sistema calcula con fórmula determinística si es gol.

💰 **Recompensas**: Cada gol = XP + tokens GOAL. ¡Mejores jugadores = mayores ganancias!

¿Te gustaría saber qué división te conviene más? 🚀`;
    }

    if (this.containsKeywords(message, ['división', 'division', 'nivel', 'tier'])) {
      return `¡Las divisiones son clave en Goal Play! 🏆

Tenemos 3 divisiones perfectamente balanceadas:

👑 **Primera División** - Para los pros
- Jugadores: Messi, Ronaldo, Mbappé
- Inversión: $1,000 - $5,000 USDT
- ROI: Máximas recompensas por victoria

🥈 **Segunda División** - El sweet spot
- Jugadores: Cole Palmer, Florian Wirtz  
- Inversión: $200 - $850 USDT
- ROI: Balance perfecto precio/performance

🥉 **Tercera División** - Para empezar
- Jugadores: Talentos emergentes
- Inversión: $30 - $130 USDT
- ROI: Entrada accesible al ecosistema

Cada división tiene 5 niveles. ¿Cuál se adapta mejor a tu presupuesto? 💰`;
    }

    if (this.containsKeywords(message, ['token', 'GOAL', 'precio', 'staking'])) {
      return `¡El token GOAL es una joya! 💎

🪙 **Datos Clave**:
- Supply: 1,000,000,000 GOAL
- Blockchain: BSC (rápido y barato)
- Contrato: 0x1e2ceb5d2b4ed8077456277ba5309f950aef2ce4

🚀 **Oportunidad ÚNICA**:
¡Staking con 25% APY las primeras 4 semanas! Después 12.5% estándar.

💰 **Utilidades**:
- Comprar packs de jugadores NFT
- Recibir recompensas por victorias
- Governance y votaciones
- Acceso a eventos exclusivos

📈 **Expansión**: Empezamos en BSC, pero la comunidad decidirá expansión a Ethereum, Solana, etc.

¿Quieres que te ayude a añadirlo a MetaMask? 🦊`;
    }

    if (this.containsKeywords(message, ['referido', 'invitar', 'comisión', 'ganar'])) {
      return `¡El sistema de referidos es INCREÍBLE! 💰

🎯 **Cómo Funciona**:
1. Creas tu código único (ej: MESSI123)
2. Compartes tu link personalizado  
3. Amigos se registran con tu código
4. ¡Ganas 5% de TODAS sus compras PARA SIEMPRE!

💵 **Ejemplos Reales**:
- Amigo compra pack $1,000 → Tú ganas $50
- Amigo compra pack $200 → Tú ganas $10
- ¡Sin límites! Más amigos = más ingresos

🚀 **Estrategias Ganadoras**:
- Comparte en redes sociales
- Explica a amigos futboleros
- Crea contenido sobre Goal Play
- Participa en comunidades crypto/gaming

¿Quieres que te ayude a crear tu código ahora? 🔗`;
    }

    if (this.containsKeywords(message, ['empezar', 'comenzar', 'inicio', 'nuevo'])) {
      return `¡Bienvenido a Goal Play! 🎉 Te guío paso a paso:

🔗 **Paso 1: Conecta Wallet**
- Instala MetaMask
- Conecta en la esquina superior derecha
- Cambia a BSC network

💰 **Paso 2: Compra tu Primer Pack**
- Ve a Shop
- Recomiendo Tercera División ($30-130)
- Paga con USDT

🏃‍♂️ **Paso 3: Entrena tu Jugador**  
- Ve a Inventory → Training
- Entrena hasta nivel 5 + 500 XP
- ¡Solo entonces podrá competir!

⚽ **Paso 4: Juega y Gana**
- Ve a Game → Penalty Shootout
- Practica vs IA primero
- ¡Gana XP y tokens GOAL!

🎁 **BONUS**: Crea tu código de referido para ganar 5% de por vida.

¿Por dónde empezamos? 🚀`;
    }

    // Respuesta general entusiasta
    return `¡Hola! 👋 Soy tu asistente personal de Goal Play, ¡la revolución del fútbol gaming! ⚽

Actualmente tenemos:
📊 ${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().totalUsers.toLocaleString()} usuarios registrados
🎮 ${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().totalGames.toLocaleString()} partidas jugadas
💰 $${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().totalRewards} en recompensas pagadas

Puedo ayudarte con:
🎯 **Gameplay**: Penalties, divisiones, estrategias
💎 **NFTs**: Jugadores, stats, progresión
💰 **Economía**: Token GOAL, staking, referidos
🚀 **Guías**: Paso a paso para empezar

Pregúntame lo que quieras como:
- "¿Cómo funciona el penalty?"
- "¿Qué división me conviene?"
- "¿Cómo gano dinero?"
- "¿Qué es el token GOAL?"

¡Estoy súper emocionado de ayudarte! 🎮💎`;
  }

  /**
   * Mejora la respuesta de la AI con datos específicos
   */
  private static enhanceResponse(response: string, intent?: any): string {
    // Añadir datos en tiempo real si es relevante
    if (intent?.intent === 'understand_economy') {
      const liveData = AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats();
      response += `\n\n📊 **Datos en Vivo**: ${liveData.totalUsers.toLocaleString()} usuarios activos, $${liveData.totalRewards} en recompensas pagadas.`;
    }

    // Añadir call-to-action contextual
    if (intent?.intent === 'get_started') {
      response += `\n\n🎯 **Próximo Paso**: ¿Quieres que te ayude a conectar tu wallet o prefieres ver los packs disponibles?`;
    }

    // Asegurar que termine con pregunta para mantener conversación
    if (!response.includes('?')) {
      const questions = [
        '¿Te gustaría saber más detalles?',
        '¿Qué más te interesa conocer?',
        '¿Tienes alguna otra pregunta?',
        '¿Te ayudo con algo más específico?'
      ];
      response += `\n\n${questions[Math.floor(Math.random() * questions.length)]}`;
    }

    return response;
  }

  /**
   * Detecta palabras clave en el mensaje
   */
  private static containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Mensaje de bienvenida dinámico
   */
  static getWelcomeMessage(): string {
    const welcomes = [
      `¡Hola, futbolero! ⚽ Soy tu asistente personal de Goal Play. 

🎮 Estamos viviendo una revolución: ${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().totalUsers.toLocaleString()} jugadores ya están ganando dinero jugando penalties.

¿Listo para unirte a la leyenda? Pregúntame lo que quieras sobre:
🎯 Cómo jugar y ganar
💰 Token GOAL y staking  
🏆 Divisiones y estrategias
👥 Sistema de referidos

¡Empecemos! 🚀`,

      `¡Bienvenido a Goal Play! 🎉 

Soy tu experto personal en la plataforma de fútbol gaming más emocionante del mundo. 

📊 **En Tiempo Real**:
- ${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().activeUsers.toLocaleString()} jugadores activos ahora
- $${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().totalRewards} pagados en recompensas
- ${AIKnowledgeService.LIVE_DATA_TEMPLATES.market_activity().recentPurchases} packs comprados hoy

¿Qué te gustaría descubrir primero? 🤔`,

      `¡Hey, champion! 🏆 

Soy tu guía en Goal Play, donde cada penalty puede cambiar tu vida financiera.

🎯 **Dato Curioso**: Nuestro jugador top ${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().topPlayer} ha ganado más de $10,000 solo jugando penalties.

¿Quieres saber cómo puedes hacer lo mismo? ⚽💰`
    ];

    return welcomes[Math.floor(Math.random() * welcomes.length)];
  }

  /**
   * Mensaje de error amigable y útil
   */
  static getErrorMessage(): string {
    return `¡Ups! 😅 Tuve un pequeño problema técnico, pero estoy aquí para ayudarte.

Mientras tanto, aquí tienes datos frescos de Goal Play:

📊 **Ahora Mismo**:
- ${AIKnowledgeService.LIVE_DATA_TEMPLATES.user_stats().activeUsers.toLocaleString()} jugadores activos
- ${AIKnowledgeService.LIVE_DATA_TEMPLATES.market_activity().recentPurchases} packs comprados hoy
- Sesión promedio: ${AIKnowledgeService.LIVE_DATA_TEMPLATES.market_activity().averageSession}

🎯 **Acciones Rápidas**:
- Conecta tu wallet y añade token GOAL
- Explora los packs desde $30 USDT
- Crea tu código de referido (5% comisión)

¿Repites tu pregunta? ¡Estoy listo! 🚀⚽`;
  }

  /**
   * Actualiza contexto de conversación
   */
  static updateContext(userMessage: string, aiResponse: string): void {
    // Detectar nivel del usuario basado en preguntas
    if (this.containsKeywords(userMessage.toLowerCase(), ['empezar', 'nuevo', 'cómo'])) {
      this.conversationContext.userLevel = 'beginner';
    } else if (this.containsKeywords(userMessage.toLowerCase(), ['estrategia', 'optimizar', 'maximizar'])) {
      this.conversationContext.userLevel = 'intermediate';
    } else if (this.containsKeywords(userMessage.toLowerCase(), ['fórmula', 'algoritmo', 'técnico'])) {
      this.conversationContext.userLevel = 'advanced';
    }

    // Detectar intereses del usuario
    const interests = [];
    if (this.containsKeywords(userMessage.toLowerCase(), ['penalty', 'jugar'])) interests.push('gameplay');
    if (this.containsKeywords(userMessage.toLowerCase(), ['token', 'dinero', 'ganar'])) interests.push('economy');
    if (this.containsKeywords(userMessage.toLowerCase(), ['referido', 'amigos'])) interests.push('referrals');
    
    this.conversationContext.userInterests = interests;
  }

  /**
   * Obtiene sugerencias inteligentes basadas en contexto
   */
  static getSmartSuggestions(): string[] {
    const { userLevel, userInterests } = this.conversationContext;

    if (userLevel === 'beginner') {
      return [
        '¿Cómo empezar en Goal Play?',
        '¿Cuánto dinero necesito?',
        '¿Qué wallet usar?',
        '¿Es seguro invertir?'
      ];
    }

    if (userInterests?.includes('economy')) {
      return [
        '¿Cuándo sube el precio de GOAL?',
        '¿Cómo maximizar staking?',
        '¿Mejor estrategia de inversión?',
        '¿ROI de cada división?'
      ];
    }

    if (userInterests?.includes('gameplay')) {
      return [
        '¿Cómo mejorar probabilidad?',
        '¿Mejor estrategia de farming?',
        '¿Cuándo jugar multiplayer?',
        '¿Cómo subir en leaderboard?'
      ];
    }

    // Sugerencias por defecto
    return [
      '¿Cómo funciona Goal Play?',
      '¿Qué son las divisiones?',
      '¿Cómo gano dinero?',
      'Explícame el token GOAL'
    ];
  }
}