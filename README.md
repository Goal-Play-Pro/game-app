# Football Gaming Platform Backend

A comprehensive football gaming platform featuring wallet authentication, on-chain payments, gacha system, penalty shootout gameplay, and BNB Smart Chain integration.

## Features

- **Multi-Chain Wallet Authentication**: SIWE (EIP-4361) for Ethereum chains and Solana signature verification
- **Payment Processing**: Complete order fulfillment with gacha draws and inventory updates
- **BNB Smart Chain Integration**: Native BSC support with optimized gas usage
- **Real-time Statistics**: Live leaderboards and user performance tracking
- **Gacha System**: Fully functional weighted character draws with anti-duplicate policies
- **Inventory Management**: Player ownership, progression, and kit customization
- **Penalty Shootout Engine**: Deterministic gameplay with AI and PvP modes
- **Division System**: 3 divisions (Primera, Segunda, Tercera) with 5 levels each
- **Comprehensive Security**: Rate limiting, idempotency, and fraud prevention
- **Referral System**: Complete 5% commission system with automatic payouts and ledger integration
- **PostgreSQL Database**: Production-ready database with TypeORM
- **Double-Entry Ledger**: Complete financial tracking system

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Configure:
# - DB_TYPE=postgres for staging/production (keep sqlite for local development)
# - PostgreSQL credentials (DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE) or DATABASE_URL
# - Receiving wallets for payments
# - JWT secret for production
```

### Database Setup

```bash
# PostgreSQL Database Setup (recommended for staging/production)
createdb goalplay
# Or use Docker:
docker run --name goalplay-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_USER=goalplay -e POSTGRES_DB=goalplay -p 5432:5432 -d postgres:14

# SQLite (optional for local development)
# DB_TYPE=sqlite will store data in ./data/goalplay.db
```

### Development

```bash
# Start backend
npm run start:backend:dev

# Start frontend (in another terminal)
npm run dev
```

The API will be available at `http://localhost:3001` with Swagger documentation at `http://localhost:3001/api/docs`.

PostgreSQL database will be created automatically with TypeORM synchronization in development.

## Architecture

### Core Modules

- **AuthModule**: Wallet-based authentication with JWT tokens
- **WalletModule**: Multi-wallet management per user
- **ShopModule**: Product catalog and variant management
- **OrderModule**: Order processing and payment verification
- **GachaModule**: Character acquisition through weighted draws
- **InventoryModule**: Player ownership and progression tracking
- **PenaltyModule**: Penalty shootout gameplay engine
- **LedgerModule**: Financial transaction recording
- **StatisticsModule**: Real-time statistics and leaderboard management

### Data Storage

The application uses PostgreSQL with TypeORM for production-ready data persistence:

- **20 Database Tables** with proper relationships
- **Foreign Key Constraints** for data integrity
- **Indexes** for optimal performance
- **Automatic Seeding** of initial data
- **Migration Support** for schema changes

## API Endpoints

### Authentication
- `POST /auth/siwe/challenge` - Generate SIWE challenge
- `POST /auth/siwe/verify` - Verify SIWE signature
- `POST /auth/solana/challenge` - Generate Solana challenge
- `POST /auth/solana/verify` - Verify Solana signature

### Wallet Management
- `GET /wallets` - Get user wallets
- `POST /wallets/link` - Link new wallet
- `DELETE /wallets/{address}` - Unlink wallet
- `PUT /wallets/{address}/primary` - Set primary wallet

### Shop
- `GET /products` - Get product catalog
- `GET /products/{id}/variants` - Get product variants

### Orders
- `POST /orders` - Create order
- `GET /orders` - Get user orders
- `GET /orders/{id}` - Get order details
- `PUT /orders/{id}/cancel` - Cancel order

### Inventory
- `GET /owned-players` - Get owned players
- `GET /owned-players/{id}/kit` - Get player kit
- `PUT /owned-players/{id}/kit` - Update player kit
- `GET /owned-players/{id}/progression` - Get player stats

### Penalty Gameplay
- `POST /penalty/sessions` - Create penalty session
- `POST /penalty/sessions/{id}/join` - Join PvP session
- `POST /penalty/sessions/{id}/attempts` - Take penalty shot
- `GET /penalty/sessions/{id}` - Get session details

### Statistics
- `GET /statistics/global` - Get global platform statistics
- `GET /leaderboard` - Get leaderboard data

### Referrals
- `GET /referral/my-code` - Get user referral code
- `POST /referral/create-code` - Create referral code
- `POST /referral/register` - Register with referral code
- `GET /referral/stats` - Get referral statistics
### Ledger
- `GET /ledger/transactions` - Get transaction history
- `GET /ledger/balance` - Get account balance

## Security Features

- **JWT Authentication** with wallet signature verification
- **Rate Limiting** (100 requests per minute)
- **Idempotency Keys** for critical operations
- **Row Level Security** equivalent for JSON data
- **CORS Protection** and helmet middleware
- **Input Validation** with class-validator
- **Audit Logging** for all critical operations

## Development

### Code Quality

```bash
npm run lint             # ESLint
```

### Building for Production

```bash
npm run build:all
npm run start:prod
```

## Data Models

### User Flow
1. **Authentication**: User signs message with wallet to get JWT
2. **Shopping**: Browse products and create order
3. **Payment**: Transfer USDT to receiving wallet (mock verification for development)
4. **Fulfillment**: System automatically executes gacha draw and updates inventory
5. **Gameplay**: Use owned players in penalty shootout sessions
6. **Referrals**: Automatic 5% commission processing with ledger integration
7. **Statistics**: All data recorded in PostgreSQL for analytics

### Key Entities
- **User**: Profile with linked wallets and metadata
- **Order**: Complete order lifecycle with automatic fulfillment
- **GachaPlayer**: Real player database with stats by division
- **OwnedPlayer**: User inventory with progression and experience
- **ReferralCommission**: Automatic 5% commission processing
- **LedgerEntry**: Double-entry bookkeeping for all transactions

## Production Considerations

- ✅ Secure JWT authentication
- ✅ PostgreSQL with proper constraints
- ✅ Complete business logic implementation
- ✅ Automatic order fulfillment
- ✅ Referral commission processing
- ✅ Double-entry ledger system
- 🔄 Replace mock payment with real blockchain verification
- 🔄 Add monitoring and alerting
- 🔄 Configure automated backups

## Support

For questions or issues:
- API documentation: `/api/docs`
- Telegram: https://t.me/goalplay
- Twitter: https://twitter.com/goalplay