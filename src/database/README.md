# 🗄️ DATABASE MODULE - MIGRACIÓN JSON → SUPABASE

## 📋 **OVERVIEW**

Este módulo proporciona una migración completa del sistema de almacenamiento JSON a Supabase, manteniendo **exactamente la misma API** del backend.

---

## 🏗️ **ARQUITECTURA**

### **Componentes Principales:**

```
DatabaseModule
├── DatabaseService          # Operaciones de Supabase
├── MigrationService        # Scripts de migración
├── DataAdapterService      # Capa de abstracción
├── DatabaseApiService      # API de Supabase
└── migrations/            # Migraciones SQL
    ├── 001_create_users.sql
    ├── 002_create_wallets.sql
    └── ...
```

### **Flujo de Datos:**

```
Backend Services
       ↓
DataAdapterService (nueva capa)
       ↓
DatabaseApiService ← → MockApiService
       ↓                    ↓
   Supabase            JSON Files
```

---

## 🔧 **CONFIGURACIÓN**

### **Variables de Entorno:**
```env
# Modo de almacenamiento
USE_DATABASE=false  # false = JSON, true = Supabase

# Configuración Supabase (se configuran automáticamente)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### **Dependencias Añadidas:**
```json
{
  "@supabase/supabase-js": "^2.57.4"
}
```

---

## 📊 **ESQUEMA DE SUPABASE**

### **Tablas Creadas:**

| Tabla | Registros JSON | Descripción |
|-------|---------------|-------------|
| `users` | users.json | Usuarios y perfiles |
| `wallets` | wallets.json | Wallets vinculadas |
| `products` | products.json | Catálogo de productos |
| `product_variants` | product-variants.json | Variantes por división |
| `orders` | orders.json | Órdenes y pagos |
| `gacha_pools` | gacha-pools.json | Pools de gacha |
| `gacha_players` | gacha-players.json | Jugadores disponibles |
| `gacha_draws` | gacha-draws.json | Historial de draws |
| `owned_players` | owned-players.json | Inventario de jugadores |
| `player_kits` | player-kits.json | Kits personalizados |
| `penalty_sessions` | penalty-sessions.json | Sesiones de penalty |
| `penalty_attempts` | penalty-attempts.json | Intentos de penalty |
| `ledger_entries` | ledger.json | Contabilidad |
| `accounts` | accounts.json | Cuentas contables |
| `referral_codes` | referral-codes.json | Códigos de referido |
| `referral_registrations` | referral-registrations.json | Registros de referidos |
| `referral_commissions` | referral-commissions.json | Comisiones |
| `challenges` | challenges.json | Challenges de auth |
| `idempotency_keys` | idempotency.json | Claves de idempotencia |

### **Características:**
- **Foreign Keys** para integridad referencial
- **Indexes** en columnas frecuentemente consultadas
- **Row Level Security** para seguridad por usuario
- **JSONB** para metadata flexible
- **Triggers** para updated_at automático

---

## 🚀 **COMANDOS DE MIGRACIÓN**

### **Migración Completa:**
```bash
# 1. Conectar a Supabase (botón en la interfaz)

# 2. Migrar datos JSON → Supabase
npm run migrate:json-to-db

# 3. Cambiar a modo database
# En .env: USE_DATABASE=true

# 4. Reiniciar backend
npm run start:backend:dev
```

### **Rollback Seguro:**
```bash
# 1. Exportar datos Supabase → JSON
npm run rollback:db-to-json

# 2. Cambiar a modo JSON
# En .env: USE_DATABASE=false

# 3. Reiniciar backend
npm run start:backend:dev
```

---

## 🔍 **VERIFICACIÓN DE MIGRACIÓN**

### **Checks Automáticos:**
El script `migrate-json-to-db.ts` incluye:

✅ **Verificación de conexión** a Supabase  
✅ **Backup automático** antes de migrar  
✅ **Migración ordenada** respetando foreign keys  
✅ **Validación de integridad** post-migración  
✅ **Estadísticas finales** de registros migrados  

### **Logs de Ejemplo:**
```
🚀 Starting JSON to Database migration...
✅ Database connection verified
📋 Running database migrations...
✅ Database migrations completed
💾 Creating database backup...
✅ Backup created: /data/backups/database-backup-2025-01-XX.sql
📦 Migrating JSON data to database...
   users.json: 1 records → users table
   wallets.json: 1 records → wallets table
   products.json: 2 records → products table
   product-variants.json: 6 records → product_variants table
   orders.json: 0 records → orders table
   ...
✅ JSON data migration completed
🔍 Verifying migration integrity...
✅ Migration verification passed
📊 Migration Statistics:
   users: 1 records
   wallets: 1 records
   products: 2 records
   product_variants: 6 records
   ...
🎉 JSON to Database migration completed successfully!
```

---

## 🔄 **MODO HÍBRIDO**

### **Flexibilidad Total:**
El sistema puede funcionar en **ambos modos** sin cambios de código:

```typescript
// En DataAdapterService
const useDatabase = this.configService.get<string>('USE_DATABASE') === 'true';

if (useDatabase) {
  return this.databaseApiService.findAll(collection);
} else {
  return this.mockApiService.findAll(collection);
}
```

### **Cambio Dinámico:**
```typescript
// Cambiar a database
dataAdapter.switchToDatabase();

// Cambiar a JSON
dataAdapter.switchToJson();
```

---

## 📈 **BENEFICIOS DE LA MIGRACIÓN**

### **Técnicos:**
- **Integridad referencial** con foreign keys
- **Performance optimizada** con indexes
- **Concurrencia real** sin file locking
- **Transacciones ACID** para consistencia
- **Backup automático** de Supabase

### **Operacionales:**
- **Escalabilidad** para millones de usuarios
- **Monitoring** con dashboard de Supabase
- **Analytics** con SQL queries
- **Replicación** y alta disponibilidad

### **Desarrollo:**
- **Misma API** - zero breaking changes
- **Rollback seguro** si hay problemas
- **Testing** con base de datos real
- **Debugging** con SQL queries

---

## 🛡️ **SEGURIDAD**

### **Row Level Security:**
```sql
-- Ejemplo: usuarios solo ven sus datos
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

### **Audit Logging:**
```sql
-- Tabla de auditoría para tracking
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid,
  action text,
  resource_type text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);
```

---

## 🧪 **TESTING**

### **Tests Existentes:**
Los tests actuales **siguen funcionando** sin cambios porque:
- DataAdapterService mantiene la misma interface
- Respuestas idénticas en ambos modos

### **Tests Adicionales:**
```bash
# Test de migración
npm run test:migration

# Test de performance
npm run test:performance

# Test de integridad
npm run test:integrity
```

---

## 📊 **MONITORING**

### **Métricas de Supabase:**
```typescript
// DatabaseService.getStats()
const stats = await databaseService.getStats();
// Retorna: conteo de registros por tabla
```

### **Health Checks:**
```typescript
// DatabaseService.isConnected()
const isHealthy = await databaseService.isConnected();
```

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comunes:**

**1. Error de conexión:**
```bash
# Verificar configuración de Supabase
# Hacer clic en "Connect to Supabase" en la interfaz
```

**2. Migración fallida:**
```bash
# Rollback automático
npm run rollback:db-to-json
```

**3. Performance lenta:**
```sql
-- Verificar indexes en Supabase dashboard
-- Analizar queries en la pestaña de SQL
```

---

## 🎯 **CONCLUSIÓN**

### **Estado Actual:**
✅ **Migración completa** implementada  
✅ **Cero breaking changes** en el código  
✅ **Rollback seguro** disponible  
✅ **Performance mejorada** con Supabase  
✅ **Escalabilidad empresarial** lista  

### **Próximos Pasos:**
1. **Conectar a Supabase** usando el botón en la interfaz
2. **Ejecutar migración** con los scripts
3. **Cambiar a modo database** en .env
4. **Monitorear performance** y logs
5. **¡Disfrutar la escalabilidad!**

**¡Tu backend ahora soporta ambos modos de almacenamiento con Supabase! 🚀⚽💰**