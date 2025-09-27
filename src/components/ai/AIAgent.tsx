import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2,
  Sparkles,
  Zap,
  Target,
  Trophy
} from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface AIAgentProps {
  className?: string;
}

const AIAgent = ({ className = '' }: AIAgentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI Service functions (local implementation)
  const getWelcomeMessage = (): string => {
    return `¡Hola, futbolero! ⚽ Soy tu asistente personal de Goal Play.

🎮 Estamos viviendo una revolución: miles de jugadores ya están ganando dinero jugando penalties.

¿Listo para unirte a la leyenda? Pregúntame lo que quieras sobre:
🎯 Cómo jugar y ganar
💰 Token GOAL y staking  
🏆 Divisiones y estrategias
👥 Sistema de referidos
🔗 API: https://game.goalplay.pro/api/

¡Empecemos! 🚀`;
  };

  const getAIResponse = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    // Simple AI responses based on keywords
    const message = userMessage.toLowerCase();
    
    console.log(`🤖 AI processing message: "${userMessage}"`);
    
    if (message.includes('penalty') || message.includes('penalti')) {
      return `¡Excelente pregunta sobre penalties! ⚽

El sistema de penalty en Goal Play es revolucionario:

🎯 **Mecánica Única**: Cada jugador tiene stats reales que determinan su probabilidad de anotar.

📊 **Por División**:
- Primera: 50%-90% probabilidad (Messi, Ronaldo)
- Segunda: 40%-80% probabilidad (Cole Palmer, Wirtz)
- Tercera: 30%-70% probabilidad (Talentos emergentes)

🎮 **Gameplay**: Eliges dirección + potencia. El sistema calcula si es gol.

💰 **Recompensas**: Cada gol = XP + tokens GOAL.

¿Te gustaría saber qué división te conviene más? 🚀`;
    }
    
    if (message.includes('token') || message.includes('goal')) {
      return `¡El token GOAL es el corazón de todo! 💎

🪙 **Datos Básicos**:
- Símbolo: GOAL
- Cantidad: 1,000,000,000 tokens
- Red: Binance Smart Chain (BSC)

💰 **Para Qué Sirve**:
- Comprar packs de jugadores NFT
- Recibir recompensas por victorias
- Hacer staking para ingresos pasivos
- Votar en decisiones del proyecto

🚀 **Oportunidad Única**:
¡Las primeras 4 semanas de staking dan DOBLE recompensas!

¿Quieres que te ayude a añadirlo a MetaMask o SafePal? 🦊🛡️`;
    }
    
    if (message.includes('division') || message.includes('división')) {
      return `¡Las divisiones son clave en Goal Play! 🏆

📊 **Sistema de 3 Divisiones**:

👑 **Primera División**:
- Jugadores élite (Messi, Ronaldo, Mbappé)
- Probabilidad: 50%-90% de anotar
- Precio: $1,000-$5,000 USDT
- Recompensas: Hasta $50 por victoria

🥈 **Segunda División**:
- Jugadores competitivos (Cole Palmer, Wirtz)
- Probabilidad: 40%-80% de anotar
- Precio: $200-$850 USDT
- Recompensas: Hasta $20 por victoria

🥉 **Tercera División**:
- Talentos emergentes
- Probabilidad: 30%-70% de anotar
- Precio: $30-$130 USDT
- Recompensas: Hasta $10 por victoria

💡 **Consejo**: ¡Empieza en Tercera para aprender y sube gradualmente!`;
    }
    
    if (message.includes('referido') || message.includes('referral')) {
      return `¡El sistema de referidos es increíble! 👥💰

🎯 **Cómo Funciona**:
1. Creas tu código único
2. Compartes tu link especial
3. Tus amigos se registran con tu código
4. ¡Ganas 5% de TODAS sus compras PARA SIEMPRE!

💰 **Ejemplo Real**:
- Tu amigo compra pack de $1,000 USDT
- Tú recibes $50 USDT automáticamente
- ¡Sin límites ni expiración!

🚀 **Estrategia Pro**:
- Comparte en redes sociales
- Crea contenido sobre Goal Play
- Invita a comunidades gaming
- ¡Algunos usuarios ganan $500+ al mes!

¿Quieres que te ayude a crear tu código? 🔗`;
    }
    
    if (message.includes('empezar') || message.includes('comenzar') || message.includes('start')) {
      return `¡Perfecto! Te guío paso a paso 🚀

🎯 **Guía Rápida para Empezar**:

1️⃣ **Conecta tu Wallet**:
   - Instala MetaMask o SafePal
   - Conecta en la esquina superior derecha
   - Cambia a BSC network

2️⃣ **Añade Token GOAL**:
   - Ve a Tokenomics
   - Clic en "Añadir a tu Wallet"
   - ¡Listo para recibir recompensas!

3️⃣ **Compra tu Primer Pack**:
   - Ve a Shop
   - Empieza con Tercera División ($30)
   - Paga con USDT

4️⃣ **Entrena tu Jugador**:
   - Ve a Inventory
   - Entrena hasta 100%
   - ¡Ya puedes jugar!

5️⃣ **Juega y Gana**:
   - Ve a Game
   - Juega penalties
   - ¡Gana tokens GOAL!

¿En qué paso necesitas ayuda? 🎮`;
    }

    if (message.includes('wallet') || message.includes('safepal') || message.includes('metamask')) {
      return `¡Excelente pregunta sobre wallets! 🦊🛡️

Goal Play es compatible con las mejores wallets:

🦊 **MetaMask**:
- La wallet más popular del mundo
- Perfecta para principiantes
- Extensión de navegador fácil

🛡️ **SafePal**:
- Wallet segura y confiable
- Soporte multi-chain nativo
- Interfaz intuitiva

🔗 **Ambas Funcionan Igual**:
- Conecta con un clic
- Paga con USDT en BSC
- Recibe recompensas automáticamente
- Gestiona tus NFTs

💡 **Consejo**: ¡Usa la que prefieras! Goal Play detecta automáticamente tu wallet y se adapta.

¿Necesitas ayuda instalando alguna? 🚀`;
    }

    return `¡Hola! 👋 Soy tu asistente experto en Goal Play.

Puedo ayudarte con TODO sobre nuestro ecosistema:
🎯 Gameplay y mecánicas
💰 Economía y tokenomics  
🏆 Estrategias de inversión
🎮 Guías paso a paso

🦊 Wallets compatibles (MetaMask, SafePal)

¿Qué te gustaría saber? ⚽🚀`;
  };

  const getErrorMessage = (): string => {
    return `¡Ups! 😅 Tuve un pequeño problema técnico, pero estoy aquí para ayudarte.

🎯 **Acciones Rápidas**:
- Conecta tu wallet y añade token GOAL
- Explora los packs desde $30 USDT
- Crea tu código de referido (5% comisión)
- API de producción: https://game.goalplay.pro/api/

¿Repites tu pregunta? ¡Estoy listo! 🚀⚽`;
  };

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: getWelcomeMessage(),
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Add typing indicator
      const typingMessage: Message = {
        id: 'typing',
        type: 'ai',
        content: '',
        timestamp: new Date(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMessage]);

      // Get AI response
      const aiResponse = await getAIResponse(userMessage.content, messages);

      // Remove typing indicator and add real response
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        return [...withoutTyping, {
          id: Date.now().toString(),
          type: 'ai',
          content: aiResponse,
          timestamp: new Date()
        }];
      });

    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Remove typing indicator and add error message
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        return [...withoutTyping, {
          id: Date.now().toString(),
          type: 'ai',
          content: getErrorMessage(),
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome-new',
      type: 'ai',
      content: getWelcomeMessage(),
      timestamp: new Date()
    }]);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-football-green to-football-blue rounded-full shadow-lg flex items-center justify-center text-white hover:shadow-xl transition-all duration-300 ${
          isOpen ? 'hidden' : 'block'
        } ${className}`}
      >
        <div className="relative">
          <Bot className="w-8 h-8" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
          />
        </div>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={`fixed bottom-6 right-6 z-50 ${
              isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
            } glass-dark rounded-xl border border-white/20 shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-football-green/20 to-football-blue/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-football-green to-football-blue rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Goal Play Assistant</h3>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-green-400">Online</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[80%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-football-blue to-football-purple' 
                            : 'bg-gradient-to-r from-football-green to-football-blue'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4 text-white" />
                          ) : (
                            <Bot className="w-4 h-4 text-white" />
                          )}
                        </div>

                        {/* Message Bubble */}
                        <div className={`rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-football-blue to-football-purple text-white'
                            : 'glass text-white'
                        }`}>
                          {message.isTyping ? (
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-football-green rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-football-green rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                <div className="w-2 h-2 bg-football-green rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                              </div>
                              <span className="text-sm text-gray-400 ml-2">Goal Play Assistant está escribiendo...</span>
                            </div>
                          ) : (
                            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Pregúntame sobre Goal Play..."
                        disabled={isLoading}
                        className="w-full input-field pr-12 text-sm disabled:opacity-50"
                      />
                      
                      {/* Quick Actions */}
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                        <button
                          onClick={() => setInputMessage('¿Cómo funciona el sistema de penalty?')}
                          className="p-1 text-gray-400 hover:text-football-green transition-colors"
                          title="Pregunta sobre penalties"
                        >
                          <Target className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setInputMessage('¿Qué son las divisiones?')}
                          className="p-1 text-gray-400 hover:text-football-blue transition-colors"
                          title="Pregunta sobre divisiones"
                        >
                          <Trophy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="btn-primary p-3 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>

                  {/* Quick Suggestions */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[
                      '¿Cómo empezar?',
                      'Explícame los NFTs',
                      'Sistema de referidos',
                      'Tokenomics GOAL'
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInputMessage(suggestion)}
                        className="text-xs px-3 py-1 glass rounded-full text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAgent;
