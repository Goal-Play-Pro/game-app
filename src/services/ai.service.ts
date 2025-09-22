// AI Service - Mock implementation for development
export class AIService {
  static getWelcomeMessage(): string {
    return `¡Hola, futbolero! ⚽ Soy tu asistente personal de Goal Play.

🎮 Estamos viviendo una revolución: miles de jugadores ya están ganando dinero jugando penalties.

¿Listo para unirte a la leyenda? Pregúntame lo que quieras sobre:
🎯 Cómo jugar y ganar
💰 Token GOAL y staking  
🏆 Divisiones y estrategias
👥 Sistema de referidos

¡Empecemos! 🚀`;
  }

  static async getResponse(userMessage: string, conversationHistory: any[]): Promise<string> {
    // Simple AI responses based on keywords
    const message = userMessage.toLowerCase();
    
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

¿Quieres que te ayude a añadirlo a MetaMask? 🦊`;
    }
    
    return `¡Hola! 👋 Soy tu asistente experto en Goal Play.

Puedo ayudarte con TODO sobre nuestro ecosistema:
🎯 Gameplay y mecánicas
💰 Economía y tokenomics  
🏆 Estrategias de inversión
🎮 Guías paso a paso

¿Qué te gustaría saber? ⚽🚀`;
  }

  static getErrorMessage(): string {
    return `¡Ups! 😅 Tuve un pequeño problema técnico, pero estoy aquí para ayudarte.

🎯 **Acciones Rápidas**:
- Conecta tu wallet y añade token GOAL
- Explora los packs desde $30 USDT
- Crea tu código de referido (5% comisión)

¿Repites tu pregunta? ¡Estoy listo! 🚀⚽`;
  }
}