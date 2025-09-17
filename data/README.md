# Sistema de Persistencia JSON

Este directorio contiene todos los archivos JSON que actúan como base de datos para la aplicación.

## Estructura de Archivos

### Autenticación y Usuarios
- `users.json` - Información de usuarios registrados
- `challenges.json` - Challenges temporales para autenticación
- `wallets.json` - Wallets vinculadas a usuarios

### Tienda y Órdenes
- `products.json` - Catálogo de productos
- `product-variants.json` - Variantes de productos por división (Primera, Segunda, Tercera)
- `orders.json` - Órdenes de compra y su estado

### Sistema Gacha
- `gacha-pools.json` - Pools de gacha por división (3 divisiones con 5 niveles cada una)
- `gacha-players.json` - Jugadores disponibles en gacha
- `gacha-pool-entries.json` - Relación entre pools y jugadores
- `gacha-draws.json` - Historial de draws realizados

### Inventario
- `owned-players.json` - Jugadores poseídos por usuarios
- `player-kits.json` - Kits personalizados de jugadores

### Gameplay
- `penalty-sessions.json` - Sesiones de penalty shootout
- `penalty-attempts.json` - Intentos de penalty en cada sesión

### Contabilidad
- `ledger.json` - Registro contable de doble entrada
- `accounts.json` - Cuentas contables por usuario

### Sistema
- `idempotency.json` - Claves de idempotencia para operaciones críticas
- `audit.log` - Log de auditoría (formato línea por línea)

## Características del Sistema

### Inicialización Automática
- Los archivos se crean automáticamente al primer uso
- Estructura de directorios se crea recursivamente
- Datos de ejemplo se insertan en el primer arranque

### Validación de Datos
- Validación de IDs únicos
- Verificación de estructura de datos
- Limpieza automática de registros corruptos

### Backup y Restauración
- Backup automático antes de operaciones críticas
- Directorio `backups/` para almacenar copias de seguridad
- Función de restauración desde backup

### Migración Futura
- Estructura compatible con MongoDB
- Interfaces preparadas para cambio de persistencia
- Tipos TypeScript mantenidos para migración

## Formato de Datos

Todos los archivos JSON siguen el formato:

```json
[
  {
    "id": "uuid-v4",
    "createdAt": "2025-01-XX...",
    "updatedAt": "2025-01-XX...",
    // ... campos específicos de la entidad
  }
]
```

## Consideraciones de Rendimiento

- Carga lazy de archivos (solo cuando se necesitan)
- Cache en memoria durante la ejecución
- Escritura asíncrona para no bloquear operaciones
- Validación periódica de integridad de datos