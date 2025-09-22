import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SeedModule } from './seed/seed.module';

// Import all entities
import { User } from './entities/user.entity';
import { Wallet } from './entities/wallet.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Order } from './entities/order.entity';
import { GachaPool } from './entities/gacha-pool.entity';
import { GachaPlayer } from './entities/gacha-player.entity';
import { GachaPoolEntry } from './entities/gacha-pool-entry.entity';
import { GachaDraw } from './entities/gacha-draw.entity';
import { OwnedPlayer } from './entities/owned-player.entity';
import { PlayerKit } from './entities/player-kit.entity';
import { PenaltySession } from './entities/penalty-session.entity';
import { PenaltyAttempt } from './entities/penalty-attempt.entity';
import { LedgerEntry } from './entities/ledger-entry.entity';
import { Account } from './entities/account.entity';
import { ReferralCode } from './entities/referral-code.entity';
import { ReferralRegistration } from './entities/referral-registration.entity';
import { ReferralCommission } from './entities/referral-commission.entity';
import { Challenge } from './entities/challenge.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';

const entities = [
  User,
  Wallet,
  Product,
  ProductVariant,
  Order,
  GachaPool,
  GachaPlayer,
  GachaPoolEntry,
  GachaDraw,
  OwnedPlayer,
  PlayerKit,
  PenaltySession,
  PenaltyAttempt,
  LedgerEntry,
  Account,
  ReferralCode,
  ReferralRegistration,
  ReferralCommission,
  Challenge,
  IdempotencyKey,
];

const toBoolean = (value?: string, defaultValue = false): boolean => {
  if (value === undefined) return defaultValue;
  return ['true', '1', 'yes'].includes(value.toLowerCase());
};

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        const rawDbType = (configService.get<string>('DB_TYPE') || 'sqlite').toLowerCase();
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction = configService.get<string>('NODE_ENV') === 'production';
        const isPostgres = rawDbType === 'postgres' || rawDbType === 'postgresql' || !!databaseUrl;

        const synchronize = toBoolean(
          configService.get<string>('DB_SYNCHRONIZE'),
          !isProduction,
        );

        const baseConfig: Partial<TypeOrmModuleOptions> = {
          entities,
          synchronize,
          logging: configService.get<string>('NODE_ENV') === 'development',
          autoLoadEntities: true,
        };

        if (isPostgres) {
          const sslEnabled = toBoolean(configService.get<string>('DB_SSL'), isProduction);
          const rejectUnauthorized = toBoolean(
            configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
            false,
          );

          if (databaseUrl) {
            return {
              type: 'postgres',
              url: databaseUrl,
              ssl: sslEnabled ? { rejectUnauthorized } : false,
              ...baseConfig,
            } as TypeOrmModuleOptions;
          }

          return {
            type: 'postgres',
            host: configService.get<string>('DB_HOST', 'localhost'),
            port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
            username: configService.get<string>('DB_USERNAME', 'goalplay'),
            password: configService.get<string>('DB_PASSWORD', 'password'),
            database: configService.get<string>('DB_DATABASE', 'goalplay'),
            ssl: sslEnabled ? { rejectUnauthorized } : false,
            ...baseConfig,
          } as TypeOrmModuleOptions;
        }

        return {
          type: 'sqlite',
          database: configService.get<string>('DB_PATH', './data/goalplay.db'),
          ...baseConfig,
        } as TypeOrmModuleOptions;
      },
    }),
    TypeOrmModule.forFeature(entities),
    SeedModule,
  ],
  exports: [TypeOrmModule, SeedModule],
})
export class DatabaseModule {}
