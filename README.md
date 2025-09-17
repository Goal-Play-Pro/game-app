# Football Gaming Platform Backend

A comprehensive football gaming platform featuring wallet authentication, on-chain payments, gacha system, penalty shootout gameplay, and BNB Smart Chain integration.

## Features

- **Multi-Chain Wallet Authentication**: SIWE (EIP-4361) for Ethereum chains and Solana signature verification
- **On-Chain Payment Processing**: USDT payments across multiple blockchain networks
- **BNB Smart Chain Integration**: Native BSC support with optimized gas usage
- **Real-time Statistics**: Live leaderboards and user performance tracking
- **Wallet Connection Logging**: Automatic database logging of wallet connections
- **Gacha System**: Weighted character draws with anti-duplicate policies
- **Inventory Management**: Player ownership, progression, and kit customization
- **Penalty Shootout Engine**: Deterministic gameplay with AI and PvP modes
- **Simplified Division System**: 3 divisions (Primera, Segunda, Tercera) with 5 levels each
- **Comprehensive Security**: Rate limiting, idempotency, and fraud prevention
- **Smart Contract Integration**: Statistics and leaderboard contracts on BSC

## Quick Start

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
npm run start:dev
```

### Smart Contract Deployment

```bash
# Deploy to BSC Testnet
npm run deploy:testnet

# Deploy to BSC Mainnet
npm run deploy:bsc

# Verify contracts
npm run verify:bsc
```

The API will be available at `http://localhost:3001` with Swagger documentation at `http://localhost:3001/api/docs`.

## BNB Smart Chain Integration

### Smart Contracts

- **Statistics Contract**: Tracks user game statistics and performance metrics
- **Leaderboard Contract**: Manages global rankings and competitive data
- **GOAL Token**: ERC20 token for rewards and governance

### Wallet Integration

- **MetaMask**: Primary wallet for BSC interactions
- **Trust Wallet**: Mobile-optimized BSC wallet
- **WalletConnect**: Universal wallet connection protocol
- **Automatic Authentication**: Seamless backend integration on wallet connect

### Gas Optimization

- **Batch Operations**: Multiple statistics updates in single transaction
- **Efficient Storage**: Optimized data structures for minimal gas usage
- **Configurable Gas Prices**: Dynamic gas pricing based on network conditions

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
- **Web3Module**: Blockchain integration and smart contract interactions

### Data Storage

The application uses JSON file storage for development, with a clean interface that allows easy migration to MongoDB:

```
/data
  ├── users.json
  ├── wallets.json
  ├── products.json
  ├── product-variants.json
  ├── orders.json
  ├── gacha-pools.json
  ├── gacha-players.json
  ├── gacha-pool-entries.json
  ├── gacha-draws.json
  ├── owned-players.json
  ├── player-kits.json
  ├── penalty-sessions.json
  ├── penalty-attempts.json
  ├── ledger.json
  ├── accounts.json
  ├── challenges.json
  ├── wallet-connections.json
  ├── user-statistics.json
  ├── leaderboard-cache.json
  └── idempotency.json
```

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

### Statistics & Leaderboard
- `GET /stats/user/{address}` - Get user statistics
- `POST /stats/user/update` - Update user statistics
- `POST /stats/game-result` - Record game result
- `POST /stats/wallet-connection` - Log wallet connection
- `GET /stats/leaderboard` - Get leaderboard data
- `GET /stats/global` - Get global platform statistics

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
- **Smart Contract Security** with OpenZeppelin standards
- **Gas Limit Protection** to prevent excessive transaction costs
- **Wallet Signature Verification** for all sensitive operations

## Development

### Running Tests

```bash
npm run test              # Unit tests
npm run test:e2e         # End-to-end tests
npm run test:cov         # Coverage report
```

### Smart Contract Testing

```bash
npx hardhat test         # Run contract tests
npx hardhat coverage     # Contract coverage
npx hardhat node         # Local blockchain
```

### Code Quality

```bash
npm run lint             # ESLint
npm run format           # Prettier
```

### Building for Production

```bash
npm run build
npm run start:prod
```

## BNB Smart Chain Deployment

### Prerequisites

1. **BNB for Gas**: Ensure deployer wallet has sufficient BNB
2. **BSCScan API Key**: For contract verification
3. **Private Key**: Secure deployment wallet private key
4. **RPC Endpoints**: Reliable BSC RPC URLs

### Deployment Steps

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Add your PRIVATE_KEY, BSC_RPC_URL, and BSCSCAN_API_KEY
   ```

2. **Deploy Contracts**:
   ```bash
   npm run deploy:bsc
   ```

3. **Verify on BSCScan**:
   ```bash
   npm run verify:bsc
   ```

4. **Update Frontend Config**:
   - Contract addresses automatically updated in `src/config/contracts.json`
   - Update `src/config/web3.ts` with production addresses

## Data Models

### User Flow
1. **Authentication**: User signs message with wallet to get JWT
2. **Shopping**: Browse products and create order
3. **Payment**: Transfer USDT to receiving wallet
4. **Fulfillment**: System verifies payment and executes gacha draw
5. **Gameplay**: Use owned players in penalty shootout sessions
6. **Statistics**: Game results recorded on-chain and in database
7. **Leaderboard**: Rankings updated in real-time

### Key Entities
- **User**: Profile with linked wallets
- **Wallet**: Blockchain addresses linked to users
- **Product/Variant**: Shop items with 3 divisions and 5 levels each
- **Order**: Purchase orders with payment tracking
- **GachaPlayer**: Drawable characters with stats
- **OwnedPlayer**: User's acquired players with progression
- **PenaltySession**: Gameplay sessions with deterministic outcomes
- **UserStatistics**: Performance metrics and rankings
- **WalletConnection**: Logged wallet connection events

## Migration to MongoDB

The codebase is designed for easy MongoDB migration:

1. Replace `JsonDataStoreService` with MongoDB repositories
2. Update entity interfaces to use Mongoose schemas
3. Maintain the same service interfaces
4. Run migration scripts to transfer JSON data

## Production Considerations

- Set secure JWT secret
- Configure proper CORS origins
- Deploy smart contracts to BSC mainnet
- Set up contract monitoring and alerts
- Configure gas price optimization
- Set up blockchain RPC endpoints
- Implement real payment verification
- Add monitoring and alerting
- Set up automated backups
- Configure load balancing
- Implement contract upgrade mechanisms

## Support

For questions or issues:
- API documentation: `/api/docs`
- Smart contract documentation: `./docs/contracts/`
- BSC integration guide: `./docs/bsc-integration.md`
- Telegram: https://t.me/goalplay
- Twitter: https://twitter.com/goalplay