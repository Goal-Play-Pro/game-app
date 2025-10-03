# Goal Play - Análisis Funcional Completo y Áreas de Mejora

## CÓMO FUNCIONA LA APLICACIÓN

### 1. FLUJO PRINCIPAL DEL USUARIO

```
1. CONECTAR WALLET
   ↓
2. EXPLORAR TIENDA (packs de jugadores)
   ↓
3. COMPRAR PACK (pago con USDT en BSC)
   ↓
4. SISTEMA GACHA (draw aleatorio)
   ↓
5. RECIBIR JUGADORES NFT
   ↓
6. JUGAR PENALTIES (ganar XP)
   ↓
7. SUBIR DE NIVEL / COMPETIR
```

---

## COMPONENTES CLAVE Y CÓMO FUNCIONAN

### A. AUTENTICACIÓN (Auth Module)

**Cómo funciona:**
1. Usuario conecta wallet (MetaMask, SafePal, etc.)
2. Backend genera un challenge (mensaje único con nonce)
3. Usuario firma el mensaje con su wallet
4. Backend verifica la firma y emite JWT
5. JWT se usa para todas las peticiones subsecuentes

**Flujo de datos:**
```
POST /auth/siwe/challenge
  → { address: "0x123...", chainType: "bsc" }
  ← { message: "Sign this message...", nonce: "abc123" }

POST /auth/siwe/verify
  → { address: "0x123...", signature: "0xabc...", message: "..." }
  ← { token: "eyJhbGc...", user: {...} }
```

**Qué se guarda:**
- User (perfil)
- Wallet vinculada
- Challenge temporal (expira)

---

### B. COMPRA DE PACKS (Order + Shop Module)

**Cómo funciona:**
1. Usuario selecciona pack (Primera/Segunda/Tercera división)
2. Se crea orden con precio en USDT
3. Usuario transfiere USDT al receiving wallet
4. Sistema monitorea blockchain cada 60 segundos
5. Al confirmar pago (12 confirmaciones), ejecuta gacha
6. Agrega jugadores al inventario
7. Procesa comisión de referido (si aplica)

**Flujo de datos:**
```
POST /orders
  → { productVariantId: "uuid", quantity: 1, paymentWallet: "0x123...", chainType: "bsc" }
  ← { orderId: "uuid", receivingWallet: "0xabc...", totalPrice: "25.00" }

Usuario transfiere USDT →→→ Blockchain

Sistema verifica automáticamente cada 60s:
  → verifyUSDTTransaction(txHash, from, to, amount)
  ← { isValid: true, confirmations: 12 }

Si confirmaciones >= 12:
  → fulfillOrder(orderId)
    → executeGachaDraw(order)
    → addPlayerToInventory(...)
    → processReferralCommission(...)
  ← Order status = "fulfilled"
```

**Qué se guarda:**
- Order (con estado: pending → paid → fulfilled)
- Transaction hash y block number
- GachaDraw (seed + jugadores obtenidos)
- OwnedPlayer (inventario del usuario)
- ReferralCommission (si aplicable)
- LedgerEntry (contabilidad doble entrada)

**⚠️ PROBLEMA IDENTIFICADO:**
El sistema usa `setTimeout` para verificar pagos cada 60s. Esto NO sobrevive reinicios del servidor.

---

### C. SISTEMA GACHA (Gacha Module)

**Cómo funciona:**
1. Orden pagada trigger gacha draw
2. Se obtiene el pool asociado al producto (ej: "Primera División")
3. Se cargan todos los jugadores del pool con sus pesos (probabilidades)
4. Se aplica política anti-duplicados (opcional)
5. Se ejecuta selección ponderada aleatoria (weighted random)
6. Se crean registros de draw y owned players

**Algoritmo de selección:**
```typescript
// Ejemplo: Pool con 3 jugadores
entries = [
  { player: "Messi", weight: 0.05 },    // 5% (legendary)
  { player: "Dybala", weight: 0.15 },   // 15% (rare)
  { player: "Gomez", weight: 0.80 }     // 80% (common)
]

totalWeight = 1.00
random = seededRandom("order-uuid-123") // 0.0 - 1.0
// Si random = 0.3:
// - Messi: 0.3 > 0.05 (NO)
// - Dybala: 0.3 - 0.05 = 0.25 > 0.15 (NO)
// - Gomez: 0.25 - 0.15 = 0.10 <= 0.80 (SÍ) ✓
```

**Qué se guarda:**
- GachaDraw (con seed para reproducibilidad)
- OwnedPlayer (jugadores en inventario)

**✅ BIEN IMPLEMENTADO:**
- Sistema determinístico con seed
- Weighted random selection
- Anti-duplicados opcional

---

### D. GAMEPLAY - PENALTY SHOOTOUT (Penalty Module)

**Cómo funciona:**
1. Usuario selecciona jugador de su inventario
2. Crea sesión de penalties (single player vs AI o multiplayer)
3. Por cada intento:
   - Usuario selecciona dirección (left/center/right)
   - Usuario selecciona potencia (0-100)
   - IA selecciona dirección aleatoria
   - Sistema calcula si es gol basado en:
     - ¿Coincide dirección? → baja probabilidad
     - ¿Diferente dirección? → alta probabilidad
     - Potencia influye en probabilidad

**Algoritmo de resultado:**
```typescript
if (direction !== keeperDirection) {
  // Portero va al lado incorrecto
  baseChance = 0.75  // 75% base
  powerBonus = (power / 100) * 0.2  // +20% máximo
  isGoal = random < (baseChance + powerBonus)  // 75%-95%
} else {
  // Portero adivina
  baseChance = 0.15  // 15% base
  powerBonus = (power / 100) * 0.25  // +25% máximo
  isGoal = random < (baseChance + powerBonus)  // 15%-40%
}
```

**Qué se guarda:**
- PenaltySession (partida completa)
- PenaltyAttempt (cada disparo)
- Estadísticas de juego

**⚠️ PROBLEMAS IDENTIFICADOS:**
1. Portero IA es completamente aleatorio (no usa stats)
2. Stats de jugadores NO afectan probabilidades
3. No hay XP ganado después de partidas
4. Validación de nivel mínimo (nivel 5, 500 XP) bloquea jugadores nuevos

---

### E. SISTEMA DE REFERIDOS (Referral Module)

**Cómo funciona:**
1. Usuario crea/obtiene código de referido único
2. Comparte link con código
3. Nuevo usuario se registra con código
4. Cuando el referido compra, sistema:
   - Calcula 5% del monto de la orden
   - Crea ReferralCommission
   - Crea LedgerEntry (débito/crédito)
   - Marca comisión como "paid"

**Flujo de datos:**
```
GET /referral/my-code
  ← { code: "MESSI123", totalReferrals: 5, totalCommissions: "12.50" }

POST /referral/register
  → { referralCode: "MESSI123" }
  ← { success: true }

Usuario referido compra pack de $25 →
  → processReferralCommission(orderId)
    - Comisión: 25 * 0.05 = $1.25
    - Crea LedgerEntry: CREDIT $1.25 a referrer
  ← Commission paid
```

**Qué se guarda:**
- ReferralCode
- ReferralRegistration (vínculo referrer-referred)
- ReferralCommission (cada comisión)
- LedgerEntry (contabilidad)

**✅ BIEN IMPLEMENTADO:**
- Sistema automático
- Integrado con orders
- Ledger tracking completo

---

### F. INVENTARIO (Inventory Module)

**Cómo funciona:**
1. Jugadores adquiridos via gacha se agregan a OwnedPlayer
2. Cada jugador tiene:
   - Nivel (1-100)
   - Experiencia
   - Kit personalizado (colores, logo)
3. Jugadores pueden subir de nivel con XP

**Qué se guarda:**
- OwnedPlayer (cada jugador poseído)
- PlayerKit (customización visual)

**⚠️ PROBLEMA:**
No hay sistema implementado para ganar XP jugando penalties.

---

### G. CONTABILIDAD (Ledger Module)

**Cómo funciona:**
Sistema de doble entrada (double-entry bookkeeping):
```
Compra de pack $25:
  DEBIT:  user_wallet      -$25
  CREDIT: platform_revenue +$25

Comisión referido $1.25:
  DEBIT:  platform_revenue -$1.25
  CREDIT: referrer_wallet  +$1.25
```

**Qué se guarda:**
- LedgerEntry (cada transacción)
- Balance tracking por cuenta

**✅ EXCELENTE:**
Sistema profesional de contabilidad.

---

## ÁREAS DE MEJORA PRIORITARIAS

### 🔴 CRÍTICO

#### 1. SISTEMA DE VERIFICACIÓN DE PAGOS
**Problema:**
```typescript
// src/modules/order/order.service.ts:93
private schedulePaymentCheck(orderId: string, delay: number = 60000) {
  setTimeout(async () => {
    // ❌ Se pierde si el servidor se reinicia
    await this.checkOrderPayment(orderId);
  }, delay);
}
```

**Solución recomendada:**
- Usar cron job con `@nestjs/schedule`
- Verificar TODAS las órdenes pendientes cada minuto
- Persistir estado de verificación

**Implementación:**
```typescript
@Cron('0 * * * * *') // Cada minuto
async checkPendingOrders() {
  const pendingOrders = await this.orderRepository.find({
    where: { status: In(['pending', 'pending_confirmations']) }
  });

  for (const order of pendingOrders) {
    await this.verifyAndUpdateOrder(order);
  }
}
```

#### 2. STATS DE JUGADORES NO AFECTAN GAMEPLAY
**Problema:**
- Jugadores tienen stats (speed, shooting, etc.)
- Penalty calculation NO usa estas stats
- Jugadores legendarios = jugadores comunes en gameplay

**Solución:**
```typescript
private calculatePenaltyResult(
  direction: string,
  keeperDirection: string,
  power: number,
  shooterStats: PlayerStats  // ← AGREGAR
): boolean {
  if (direction !== keeperDirection) {
    const baseChance = 0.75;
    const powerBonus = (power / 100) * 0.2;
    const shootingBonus = (shooterStats.shooting / 100) * 0.15;  // ← NUEVO
    return Math.random() < (baseChance + powerBonus + shootingBonus);
  }
  // ...
}
```

#### 3. NO HAY SISTEMA DE XP EN GAMEPLAY
**Problema:**
- `PenaltyService.attemptPenalty()` NO otorga XP
- Jugadores quedan estancados en nivel 1

**Solución:**
```typescript
// Después de cada penalty exitoso
if (isGoal) {
  await this.grantExperience(session.hostPlayerId, 50); // +50 XP por gol
}

private async grantExperience(ownedPlayerId: string, xp: number) {
  const player = await this.ownedPlayerRepository.findOne({
    where: { id: ownedPlayerId }
  });

  const newXP = player.experience + xp;
  const newLevel = Math.floor(newXP / 1000) + 1; // Cada 1000 XP = 1 nivel

  await this.ownedPlayerRepository.update(ownedPlayerId, {
    experience: newXP,
    currentLevel: Math.min(newLevel, 100)
  });
}
```

---

### 🟡 IMPORTANTE

#### 4. VALIDACIÓN DE NIVEL BLOQUEA JUGADORES NUEVOS
**Problema:**
```typescript
// src/modules/penalty/penalty.service.ts:41
if (ownedPlayer.currentLevel < 5 || ownedPlayer.experience < 500) {
  throw new BadRequestException('Player needs more training before playing');
}
```
**Jugadores nuevos:** nivel 1, 0 XP → NO pueden jugar → NO pueden ganar XP → DEADLOCK

**Solución:**
- Remover validación O
- Agregar modo "training" sin restricciones

#### 5. IA DEL PORTERO ES DEMASIADO SIMPLE
**Problema:**
```typescript
private getAIKeeperDirection(): string {
  const directions = ['left', 'center', 'right'];
  return directions[Math.floor(Math.random() * directions.length)];
}
```
100% aleatorio, no usa stats de portero.

**Solución:**
- Usar stats de goalkeeping
- Implementar patrones (aprender del jugador)
- Dificultad adaptativa

#### 6. FALTA SISTEMA DE RECOMPENSAS
**Problema:**
- Jugadores ganan partidas pero no reciben tokens/premios
- No hay incentivo económico para jugar

**Solución:**
- Otorgar tokens por victorias
- Sistema de daily rewards
- Tournaments con prize pools

---

### 🟢 MEJORAS DE CALIDAD

#### 7. FALTA LEADERBOARD REAL
**Hay endpoint pero no se actualiza con resultados de partidas**

#### 8. NO HAY MARKETPLACE SECUNDARIO
**Usuarios no pueden vender/comprar jugadores entre ellos**

#### 9. FALTA SISTEMA DE ACHIEVEMENTS
**No hay badges, logros, milestones**

#### 10. NO HAY NOTIFICACIONES
**Usuarios no saben cuando reciben comisiones, ganan partidas, etc.**

---

## RESUMEN DE PRIORIDADES

### Para que la app funcione correctamente:
1. ✅ **Arreglar sistema de verificación de pagos** (cron job)
2. ✅ **Implementar XP en penalties**
3. ✅ **Remover/ajustar validación de nivel mínimo**
4. ✅ **Stats afecten gameplay**

### Para mejorar experiencia:
5. 🎮 IA del portero más inteligente
6. 💰 Sistema de recompensas en tokens
7. 🏆 Leaderboard actualizado en tiempo real
8. 🔔 Sistema de notificaciones

### Para crecimiento:
9. 🛒 Marketplace secundario (P2P)
10. 🏅 Achievements y gamification
11. 🎯 Tournaments y eventos
12. 📱 Mobile app (React Native)

---

## CONCLUSIÓN

**Tu app está muy bien construida arquitecturalmente**, pero tiene problemas críticos en la capa de lógica de negocio:

- ✅ **Backend robusto:** NestJS, TypeORM, PostgreSQL
- ✅ **Blockchain integration:** Verificación real de USDT
- ✅ **Sistemas completos:** Auth, Shop, Gacha, Ledger, Referrals
- ❌ **Gameplay desconectado:** Stats no importan, XP no funciona
- ❌ **Payment monitoring frágil:** setTimeout no sobrevive reinicios
- ❌ **Falta economía de juego:** Sin recompensas, sin incentivos

**Recomendación:**
Priorizar los 4 fixes críticos para que el loop de juego funcione completamente:
1. Pagos confiables
2. XP funcionando
3. Stats importando
4. Jugadores nuevos pueden jugar

Después expandir con features de retención (recompensas, achievements, tournaments).
