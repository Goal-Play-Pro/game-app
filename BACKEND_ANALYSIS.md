# 📊 ANÁLISIS PROFUNDO: BACKEND GOAL PLAY & BASE DE DATOS

## 🎯 **RESUMEN EJECUTIVO**

Goal Play es una **plataforma completa de gaming de fútbol** con blockchain que maneja:
- **Autenticación multi-wallet** (Ethereum, Solana, BSC, etc.)
- **Sistema de pagos on-chain** con USDT
- **Sistema gacha** para adquisición de jugadores NFT
- **Motor de penalty shootout** determinístico
- **Contabilidad de doble entrada** completa
- **Sistema de referidos** con comisiones automáticas
- **Gestión de inventario** y progresión de jugadores

---

## 🗄️ **ESTRUCTURA COMPLETA DE DATOS**

### **📋 TABLAS PRINCIPALES (20 TABLAS)**

#### **1. 👤 USUARIOS Y AUTENTICACIÓN**
```sql
-- users: Perfiles de usuarios
- id (uuid)
- wallet_address (text, único)
- chain (ethereum/bsc/polygon/etc)
- is_active (boolean)
- last_login (timestamp)
- metadata (jsonb: nickname, avatar, preferencias)

-- wallets: Wallets vinculadas por usuario
- id (uuid)
- user_id (FK → users)
- address (text, único)
- chain_type (ethereum/bsc/polygon/etc)
- is_primary (boolean)
- is_active (boolean)
- linked_at (timestamp)

-- challenges: Challenges temporales para auth
- id (uuid)
- nonce (text, único)
- address (text)
- chain_type (text)
- message (text)
- expires_at (timestamp)
- used (boolean)
```

#### **2. 🛒 TIENDA Y PRODUCTOS**
```sql
-- products: Catálogo de productos
- id (uuid)
- name (text)
- description (text)
- type (character_pack/cosmetic/boost)
- is_active (boolean)
- metadata (jsonb)

-- product_variants: Variantes por división
- id (uuid)
- product_id (FK → products)
- name (text)
- description (text)
- division (primera/segunda/tercera)
- level (1-5)
- price_usdt (decimal)
- is_active (boolean)
- max_purchases_per_user (integer)
- gacha_pool_id (text)
```

#### **3. 💳 ÓRDENES Y PAGOS**
```sql
-- orders: Órdenes de compra
- id (uuid)
- user_id (FK → users)
- product_variant_id (FK → product_variants)
- quantity (integer)
- unit_price_usdt (decimal)
- total_price_usdt (decimal)
- status (pending/paid/fulfilled/cancelled/expired)
- payment_wallet (text)
- receiving_wallet (text)
- chain_type (ethereum/bsc/polygon/etc)
- transaction_hash (text)
- block_number (bigint)
- confirmations (integer)
- expires_at (timestamp)
- paid_at (timestamp)
- fulfilled_at (timestamp)
- cancelled_at (timestamp)
```

#### **4. 🎲 SISTEMA GACHA**
```sql
-- gacha_pools: Pools de gacha por división
- id (uuid)
- name (text)
- division (primera/segunda/tercera)
- is_active (boolean)
- anti_duplicate_policy (text)
- guaranteed_rarity (common/rare/epic/legendary)
- metadata (jsonb)

-- gacha_players: Jugadores disponibles
- id (uuid)
- name (text)
- position (goalkeeper/defender/midfielder/forward)
- rarity (common/uncommon/rare/epic/legendary)
- division (primera/segunda/tercera)
- base_stats (jsonb: speed, shooting, passing, defending, goalkeeping, overall)
- image_url (text)

-- gacha_pool_entries: Relación pools-jugadores
- id (uuid)
- pool_id (FK → gacha_pools)
- player_id (FK → gacha_players)
- weight (decimal: probabilidad)
- is_active (boolean)

-- gacha_draws: Historial de draws
- id (uuid)
- user_id (FK → users)
- order_id (FK → orders)
- pool_id (FK → gacha_pools)
- players_drawn (uuid[])
- seed (text)
- draw_date (timestamp)
```

#### **5. 🎒 INVENTARIO DE JUGADORES**
```sql
-- owned_players: Jugadores poseídos
- id (uuid)
- user_id (FK → users)
- player_id (FK → gacha_players)
- source_order_id (FK → orders)
- source_draw_id (FK → gacha_draws)
- acquired_at (timestamp)
- current_level (integer: 1-100)
- experience (integer)
- is_active (boolean)

-- player_kits: Kits personalizados
- id (uuid)
- owned_player_id (FK → owned_players)
- version (integer)
- name (text)
- primary_color (hex color)
- secondary_color (hex color)
- logo_url (text)
- is_active (boolean)
- equipped_at (timestamp)
```

#### **6. ⚽ GAMEPLAY - PENALTY SHOOTOUT**
```sql
-- penalty_sessions: Sesiones de juego
- id (uuid)
- host_user_id (FK → users)
- guest_user_id (FK → users, nullable para AI)
- type (single_player/multiplayer)
- status (waiting/in_progress/completed/cancelled)
- host_player_id (FK → owned_players)
- guest_player_id (FK → owned_players, nullable)
- max_rounds (integer: 3-10)
- current_round (integer)
- host_score (integer)
- guest_score (integer)
- winner_id (FK → users, nullable)
- seed (text: para determinismo)
- started_at (timestamp)
- completed_at (timestamp)

-- penalty_attempts: Intentos de penalty
- id (uuid)
- session_id (FK → penalty_sessions)
- round (integer)
- shooter_user_id (FK → users)
- goalkeeper_id (text: puede ser 'ai')
- shooter_player_id (FK → owned_players)
- goalkeeper_player_id (text)
- direction (left/center/right)
- power (integer: 0-100)
- keeper_direction (left/center/right)
- is_goal (boolean)
- attempted_at (timestamp)
- seed (text)
```

#### **7. 💰 CONTABILIDAD DE DOBLE ENTRADA**
```sql
-- ledger_entries: Registro contable
- id (uuid)
- user_id (FK → users)
- transaction_id (text)
- account (text: user_wallet/platform_revenue/etc)
- type (debit/credit)
- amount (decimal(18,8))
- currency (text: USDT/ETH/BNB/etc)
- description (text)
- reference_type (order/gacha_draw/penalty_reward/refund/referral)
- reference_id (text)
- balance_after (decimal(18,8))
- metadata (jsonb)

-- accounts: Cuentas contables por usuario
- id (uuid)
- user_id (FK → users)
- name (text)
- type (asset/liability/revenue/expense)
- currency (text)
- balance (decimal(18,8))
- is_active (boolean)
```

#### **8. 👥 SISTEMA DE REFERIDOS**
```sql
-- referral_codes: Códigos de referido
- id (uuid)
- user_id (FK → users)
- wallet_address (text)
- code (text, único)
- is_active (boolean)
- total_referrals (integer)
- total_commissions (decimal)

-- referral_registrations: Registros de referidos
- id (uuid)
- referrer_user_id (FK → users)
- referrer_wallet (text)
- referred_user_id (FK → users)
- referred_wallet (text)
- referral_code (text)
- registered_at (timestamp)
- is_active (boolean)

-- referral_commissions: Comisiones pagadas
- id (uuid)
- referrer_user_id (FK → users)
- referrer_wallet (text)
- referred_user_id (FK → users)
- referred_wallet (text)
- order_id (FK → orders)
- order_amount (decimal)
- commission_amount (decimal)
- commission_percentage (decimal: default 5%)
- status (pending/paid/failed)
- paid_at (timestamp)
```

#### **9. 🔧 SISTEMA Y SEGURIDAD**
```sql
-- idempotency_keys: Prevención de operaciones duplicadas
- id (uuid)
- key (text, único)
- user_id (FK → users)
- response (jsonb)
- expires_at (timestamp)

-- audit_logs: Auditoría completa
- id (uuid)
- user_id (FK → users)
- action (text)
- resource_type (text)
- resource_id (text)
- old_values (jsonb)
- new_values (jsonb)
- ip_address (text)
- user_agent (text)
- correlation_id (text)
- created_at (timestamp)
```

---

## 🔄 **FLUJOS DE DATOS PRINCIPALES**

### **🔐 1. AUTENTICACIÓN**
```
Usuario → Wallet Connect → Challenge → Firma → JWT → Usuario en DB
```
**Datos guardados:**
- Perfil de usuario con wallet principal
- Wallets adicionales vinculadas
- Challenges temporales para verificación
- Logs de conexión de wallets

### **🛒 2. COMPRA DE PACKS**
```
Usuario → Selecciona Pack → Crea Orden → Pago USDT → Gacha Draw → Jugadores
```
**Datos guardados:**
- Orden con detalles de pago
- Transacción blockchain verificada
- Draw de gacha con seed determinístico
- Jugadores obtenidos en inventario
- Registro contable de la transacción
- Comisión de referido (si aplica)

### **⚽ 3. GAMEPLAY**
```
Usuario → Selecciona Jugador → Crea Sesión → Penalty Shots → Resultados → XP
```
**Datos guardados:**
- Sesión de penalty con configuración
- Cada intento de penalty con resultado
- Experiencia ganada por jugadores
- Estadísticas de performance
- Recompensas en tokens

### **👥 4. SISTEMA DE REFERIDOS**
```
Usuario → Crea Código → Comparte Link → Referido se Registra → Compra → Comisión
```
**Datos guardados:**
- Código de referido único por usuario
- Registro de usuarios referidos
- Comisiones automáticas (5% de cada compra)
- Historial de pagos de comisiones

---

## 📈 **MÉTRICAS Y ANALYTICS**

### **📊 Datos de Usuario Individual:**
- **Perfil:** Wallets, nivel, experiencia total
- **Inventario:** Jugadores poseídos, niveles, kits personalizados
- **Gameplay:** Partidas jugadas, ratio de victorias, mejor racha
- **Financiero:** Dinero gastado, ganado, balance actual
- **Referidos:** Código personal, referidos activos, comisiones ganadas

### **🌍 Datos Globales de Plataforma:**
- **Usuarios:** Total registrados, activos diarios/mensuales
- **Gameplay:** Partidas totales, goles anotados, tiempo jugado
- **Económico:** Volumen de transacciones, revenue total, comisiones pagadas
- **NFTs:** Jugadores creados, draws ejecutados, rareza distribuida

### **📋 Datos de Negocio:**
- **Revenue:** Ingresos por división, por nivel, por usuario
- **Retención:** Usuarios que regresan, engagement por cohorte
- **Viral:** Efectividad del sistema de referidos
- **Performance:** Tiempos de respuesta, errores, uptime

---

## 🔍 **OPERACIONES CRUD COMPLETAS**

### **👤 Gestión de Usuarios:**
- **CREATE:** Registro automático al conectar wallet
- **READ:** Perfil completo con wallets y estadísticas
- **UPDATE:** Preferencias, nickname, avatar
- **DELETE:** Desactivación (soft delete)

### **🛒 Gestión de Tienda:**
- **CREATE:** Nuevos productos y variantes (admin)
- **READ:** Catálogo público con precios por división
- **UPDATE:** Precios, disponibilidad, metadatos
- **DELETE:** Desactivación de productos

### **💳 Gestión de Órdenes:**
- **CREATE:** Nueva orden con wallet de pago
- **READ:** Historial de compras del usuario
- **UPDATE:** Estado de pago, confirmaciones blockchain
- **DELETE:** Cancelación de órdenes pendientes

### **🎲 Gestión de Gacha:**
- **CREATE:** Nuevos jugadores y pools (admin)
- **READ:** Jugadores disponibles por división
- **UPDATE:** Estadísticas, probabilidades, metadatos
- **EXECUTE:** Draw determinístico con anti-duplicados

### **🎒 Gestión de Inventario:**
- **CREATE:** Jugadores adquiridos via gacha
- **READ:** Inventario completo con progresión
- **UPDATE:** Nivel, experiencia, kits personalizados
- **TRANSFER:** Intercambio entre usuarios (futuro)

### **⚽ Gestión de Gameplay:**
- **CREATE:** Nuevas sesiones de penalty
- **READ:** Historial de partidas y estadísticas
- **UPDATE:** Progreso de partida, scores
- **COMPLETE:** Finalización con recompensas

### **💰 Gestión Contable:**
- **CREATE:** Asientos de doble entrada automáticos
- **READ:** Historial de transacciones y balances
- **RECONCILE:** Verificación de integridad contable
- **REPORT:** Reportes financieros por usuario/global

---

## 🔐 **SEGURIDAD Y COMPLIANCE**

### **🛡️ Seguridad Implementada:**
- **Row Level Security (RLS)** en todas las tablas
- **JWT Authentication** con expiración
- **Rate Limiting** (100 req/min)
- **Idempotency Keys** para operaciones críticas
- **Audit Logging** completo
- **Input Validation** en todos los endpoints
- **CORS Protection** configurado

### **📋 Compliance:**
- **GDPR Ready:** Soft deletes, data export
- **Financial Compliance:** Doble entrada, audit trail
- **Blockchain Compliance:** Verificación on-chain
- **Gaming Compliance:** Fair play, determinismo

---

## 🚀 **CAPACIDADES TÉCNICAS**

### **⚡ Performance:**
- **Indexes estratégicos** en todas las consultas frecuentes
- **Connection pooling** automático con PostgreSQL gestionado
- **Query optimization** con foreign keys
- **Caching** en memoria para datos frecuentes

### **📊 Escalabilidad:**
- **Horizontal scaling** preparado para instancias administradas
- **Microservices ready** con módulos independientes
- **API versioning** preparado
- **Load balancing** compatible

### **🔄 Integración:**
- **Multi-blockchain** (Ethereum, BSC, Polygon, Arbitrum, Solana)
- **Multiple wallets** por usuario
- **External APIs** para precios y verificación
- **Webhook support** para eventos blockchain

---

## 📊 **DATOS ESPECÍFICOS QUE SE GUARDAN**

### **🎮 Datos de Gaming:**
```json
{
  "penalty_session": {
    "players": ["Messi", "Ronaldo"],
    "score": "3-2",
    "rounds": 5,
    "seed": "deterministic-12345",
    "shots": [
      {
        "direction": "left",
        "power": 85,
        "keeper_direction": "right",
        "result": "goal"
      }
    ]
  }
}
```

### **💎 Datos de NFT/Jugadores:**
```json
{
  "player": {
    "name": "Lionel Messi",
    "position": "forward",
    "rarity": "legendary",
    "division": "primera",
    "stats": {
      "speed": 95,
      "shooting": 98,
      "passing": 96,
      "defending": 45,
      "goalkeeping": 30,
      "overall": 93
    },
    "level": 15,
    "experience": 2500,
    "kit": {
      "name": "Barcelona Classic",
      "primary_color": "#FF0000",
      "secondary_color": "#0000FF"
    }
  }
}
```

### **💰 Datos Financieros:**
```json
{
  "transaction": {
    "type": "purchase",
    "amount": "25.00",
    "currency": "USDT",
    "from_account": "user_wallet",
    "to_account": "platform_revenue",
    "reference": "order_12345",
    "balance_after": "975.00",
    "blockchain_tx": "0xabc123..."
  }
}
```

### **👥 Datos de Referidos:**
```json
{
  "referral": {
    "code": "MESSI123",
    "referrer_wallet": "0x742d35Cc...",
    "referred_wallet": "0x123abc...",
    "commission": {
      "amount": "1.25",
      "percentage": 5,
      "order_amount": "25.00",
      "status": "paid"
    }
  }
}
```

---

## 🎯 **CASOS DE USO PRINCIPALES**

### **🎮 Para Gamers:**
1. **Conectar wallet** → Perfil automático
2. **Comprar packs** → Pago USDT → Recibir jugadores
3. **Jugar penalties** → Ganar XP y recompensas
4. **Personalizar kits** → Expresión personal
5. **Competir** → Subir en rankings globales

### **💼 Para el Negocio:**
1. **Revenue tracking** → Ingresos por división/usuario
2. **User analytics** → Retención, engagement, LTV
3. **Fraud detection** → Patrones anómalos de juego
4. **Marketing attribution** → Efectividad de referidos
5. **Financial reporting** → P&L, cash flow, reconciliación

### **🔧 Para Desarrolladores:**
1. **API completa** → 40+ endpoints documentados
2. **Real-time data** → WebSockets para gameplay
3. **Blockchain integration** → Verificación automática
4. **Audit trail** → Debugging y compliance
5. **Performance monitoring** → Métricas de sistema

---

## 📋 **RESUMEN DE CAPACIDADES**

### **✅ Lo que el Backend PUEDE hacer:**
- ✅ **Autenticación multi-wallet** sin contraseñas
- ✅ **Pagos on-chain** verificados automáticamente
- ✅ **Sistema gacha** justo y determinístico
- ✅ **Gameplay en tiempo real** con penalty shootouts
- ✅ **Progresión de jugadores** con niveles y experiencia
- ✅ **Sistema de referidos** con comisiones automáticas
- ✅ **Contabilidad completa** con doble entrada
- ✅ **Analytics avanzados** para negocio y usuarios
- ✅ **Escalabilidad empresarial** lista para clústeres PostgreSQL
- ✅ **Seguridad de nivel bancario** con RLS y auditoría

### **📊 Datos que se Almacenan:**
- **👤 Usuarios:** 15+ campos por usuario
- **🎮 Gameplay:** Cada shot, cada partida, cada resultado
- **💰 Financiero:** Cada centavo, cada transacción, cada balance
- **🎲 Gacha:** Cada draw, cada jugador, cada probabilidad
- **👥 Social:** Cada referido, cada comisión, cada interacción
- **🔒 Seguridad:** Cada acción, cada cambio, cada acceso

### **🎯 Valor de Negocio:**
- **Revenue:** $X por usuario, $Y por división, $Z total
- **Engagement:** X partidas/día, Y minutos/sesión
- **Viral:** X% conversion rate de referidos
- **Retention:** X% usuarios activos después de 30 días
- **LTV:** $X lifetime value promedio por usuario

---

## 🚀 **CONCLUSIÓN**

**¡Tu backend es una MÁQUINA DE DATOS completa!**

Maneja **TODO** lo necesario para una plataforma de gaming blockchain exitosa:
- **Usuarios y autenticación** ✅
- **Pagos y transacciones** ✅  
- **Gaming y recompensas** ✅
- **NFTs y coleccionables** ✅
- **Analytics y métricas** ✅
- **Referidos y viralidad** ✅
- **Seguridad y compliance** ✅

**¡Es un backend de nivel empresarial listo para escalar a millones de usuarios! 🚀⚽💰**
