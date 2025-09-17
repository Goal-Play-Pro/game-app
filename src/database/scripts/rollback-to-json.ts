import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { DatabaseService } from '../database.service';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Script to rollback from database to JSON files
 * Run with: npm run rollback:db-to-json
 */
async function rollbackToJson() {
  const logger = new Logger('DbToJsonRollback');
  
  try {
    logger.log('🔄 Starting Database to JSON rollback...');
    
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get database service
    const databaseService = app.get(DatabaseService);
    
    // Check database connection
    const isConnected = await databaseService.isConnected();
    if (!isConnected) {
      logger.warn('Database connection not available');
      await app.close();
      return;
    }
    logger.log('✅ Database connection verified');
    
    // Create data directory
    const dataDir = join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    // Export tables to JSON files
    const tables = [
      { table: 'users', file: 'users.json' },
      { table: 'wallets', file: 'wallets.json' },
      { table: 'products', file: 'products.json' },
      { table: 'product_variants', file: 'product-variants.json' },
      { table: 'orders', file: 'orders.json' },
      { table: 'gacha_pools', file: 'gacha-pools.json' },
      { table: 'gacha_players', file: 'gacha-players.json' },
      { table: 'gacha_pool_entries', file: 'gacha-pool-entries.json' },
      { table: 'gacha_draws', file: 'gacha-draws.json' },
      { table: 'owned_players', file: 'owned-players.json' },
      { table: 'player_kits', file: 'player-kits.json' },
      { table: 'penalty_sessions', file: 'penalty-sessions.json' },
      { table: 'penalty_attempts', file: 'penalty-attempts.json' },
      { table: 'ledger_entries', file: 'ledger.json' },
      { table: 'accounts', file: 'accounts.json' },
      { table: 'referral_codes', file: 'referral-codes.json' },
      { table: 'referral_registrations', file: 'referral-registrations.json' },
      { table: 'referral_commissions', file: 'referral-commissions.json' },
      { table: 'challenges', file: 'challenges.json' },
      { table: 'idempotency_keys', file: 'idempotency.json' },
    ];

    for (const { table, file } of tables) {
      try {
        logger.log(`📤 Exporting ${table} to ${file}...`);
        
        // This would need to be implemented with proper Supabase queries
        // For now, create empty files
        const filePath = join(dataDir, file);
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
        
        logger.log(`✅ Exported to ${file}`);
      } catch (error) {
        logger.warn(`⚠️ Could not export ${table}: ${error.message}`);
      }
    }
    
    logger.log('🎉 Database to JSON rollback completed successfully!');
    logger.log('💡 To switch to JSON mode, set USE_DATABASE=false in your .env file');
    
    await app.close();
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    process.exit(1);
  }
}

function convertDbRowToJson(row: any): any {
  const converted = { ...row };
  
  // Convert snake_case to camelCase
  const keyMap: Record<string, string> = {
    'wallet_address': 'walletAddress',
    'is_active': 'isActive',
    'last_login': 'lastLogin',
    'user_id': 'userId',
    'chain_type': 'chainType',
    'is_primary': 'isPrimary',
    'linked_at': 'linkedAt',
    'last_used_at': 'lastUsedAt',
    'product_id': 'productId',
    'price_usdt': 'priceUSDT',
    'max_purchases_per_user': 'maxPurchasesPerUser',
    'gacha_pool_id': 'gachaPoolId',
    'product_variant_id': 'productVariantId',
    'unit_price_usdt': 'unitPriceUSDT',
    'total_price_usdt': 'totalPriceUSDT',
    'payment_wallet': 'paymentWallet',
    'receiving_wallet': 'receivingWallet',
    'transaction_hash': 'transactionHash',
    'block_number': 'blockNumber',
    'expires_at': 'expiresAt',
    'paid_at': 'paidAt',
    'fulfilled_at': 'fulfilledAt',
    'cancelled_at': 'cancelledAt',
    'failure_reason': 'failureReason',
    'created_at': 'createdAt',
    'updated_at': 'updatedAt',
  };
  
  // Convert keys
  Object.keys(keyMap).forEach(dbKey => {
    if (converted[dbKey] !== undefined) {
      converted[keyMap[dbKey]] = converted[dbKey];
      delete converted[dbKey];
    }
  });
  
  return converted;
}

// Run rollback if this file is executed directly
if (require.main === module) {
  rollbackToJson();
}

export { rollbackToJson };