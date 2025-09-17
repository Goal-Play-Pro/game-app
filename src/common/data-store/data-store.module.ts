import { Module, Global } from '@nestjs/common';
import { DataStoreFactory } from './data-store-factory.service';
import { JsonDataStoreService } from '../services/json-data-store.service';
import { DATA_STORE_TOKENS } from './data-store.tokens';
import { User } from '../../modules/auth/entities/user.entity';
import { Wallet } from '../../modules/wallet/entities/wallet.entity';
import { Product, ProductVariant } from '../../modules/shop/entities/product.entity';
import { Order } from '../../modules/order/entities/order.entity';
import { GachaPool, GachaPlayer } from '../../modules/gacha/entities/gacha.entity';
import { OwnedPlayer } from '../../modules/inventory/entities/inventory.entity';
import { PenaltySession } from '../../modules/penalty/entities/penalty.entity';
import { LedgerEntry } from '../../modules/ledger/entities/ledger.entity';

@Global()
@Module({
  providers: [
    DataStoreFactory,
    // Solución 3: Providers con Factory Functions
    {
      provide: DATA_STORE_TOKENS.USERS,
      useFactory: () => new JsonDataStoreService<User>('users'),
    },
    {
      provide: DATA_STORE_TOKENS.WALLETS,
      useFactory: () => new JsonDataStoreService<Wallet>('wallets'),
    },
    {
      provide: DATA_STORE_TOKENS.PRODUCTS,
      useFactory: () => new JsonDataStoreService<Product>('products'),
    },
    {
      provide: DATA_STORE_TOKENS.ORDERS,
      useFactory: () => new JsonDataStoreService<Order>('orders'),
    },
    {
      provide: DATA_STORE_TOKENS.GACHA_POOLS,
      useFactory: () => new JsonDataStoreService<GachaPool>('gacha-pools'),
    },
    {
      provide: DATA_STORE_TOKENS.GACHA_PLAYERS,
      useFactory: () => new JsonDataStoreService<GachaPlayer>('gacha-players'),
    },
    {
      provide: DATA_STORE_TOKENS.OWNED_PLAYERS,
      useFactory: () => new JsonDataStoreService<OwnedPlayer>('owned-players'),
    },
    {
      provide: DATA_STORE_TOKENS.PENALTY_SESSIONS,
      useFactory: () => new JsonDataStoreService<PenaltySession>('penalty-sessions'),
    },
    {
      provide: DATA_STORE_TOKENS.LEDGER,
      useFactory: () => new JsonDataStoreService<LedgerEntry>('ledger'),
    },
    {
      provide: DATA_STORE_TOKENS.CHALLENGES,
      useFactory: () => new JsonDataStoreService<any>('challenges'),
    },
    {
      provide: DATA_STORE_TOKENS.IDEMPOTENCY,
      useFactory: () => new JsonDataStoreService<any>('idempotency'),
    },
  ],
  exports: [
    DataStoreFactory,
    ...Object.values(DATA_STORE_TOKENS),
  ],
})
export class DataStoreModule {}