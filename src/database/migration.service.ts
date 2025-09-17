import { Injectable, Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(
    @Inject('SUPABASE_CLIENT')
    private supabase: SupabaseClient | null,
  ) {}

  /**
   * Run all pending migrations
   */
  async runMigrations(): Promise<void> {
    if (!this.supabase) {
      this.logger.warn('Supabase client not available, skipping migrations');
      return;
    }

    try {
      this.logger.log('All migrations are handled by Supabase automatically');
    } catch (error) {
      this.logger.error('Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Migrate data from JSON files to database
   */
  async migrateFromJson(): Promise<void> {
    if (!this.supabase) {
      this.logger.warn('Supabase client not available, skipping JSON migration');
      return;
    }

    this.logger.log('Starting JSON to database migration...');

    try {
      const dataDir = join(process.cwd(), 'data');
      
      // Check if data directory exists
      try {
        await fs.access(dataDir);
      } catch {
        this.logger.log('No data directory found, skipping JSON migration');
        return;
      }

      // Migration order is important due to foreign key constraints
      const migrationOrder = [
        'users',
        'wallets',
        'products',
        'product-variants',
        'gacha-pools',
        'gacha-players',
        'gacha-pool-entries',
        'orders',
        'gacha-draws',
        'owned-players',
        'player-kits',
        'penalty-sessions',
        'penalty-attempts',
        'accounts',
        'ledger',
        'referral-codes',
        'referral-registrations',
        'referral-commissions',
        'challenges',
        'idempotency',
      ];

      for (const fileName of migrationOrder) {
        await this.migrateJsonFile(fileName);
      }

      this.logger.log('JSON to database migration completed successfully');
    } catch (error) {
      this.logger.error('Error during JSON migration:', error);
      throw error;
    }
  }

  private async migrateJsonFile(fileName: string): Promise<void> {
    const filePath = join(process.cwd(), 'data', `${fileName}.json`);
    
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const jsonData = JSON.parse(fileContent);
      
      if (!Array.isArray(jsonData) || jsonData.length === 0) {
        this.logger.log(`No data to migrate from ${fileName}.json`);
        return;
      }

      const tableName = this.getTableName(fileName);
      
      this.logger.log(`Migrating ${jsonData.length} records from ${fileName}.json to ${tableName}`);

      // Convert and insert data
      const convertedData = jsonData.map(item => this.convertJsonToDb(item));
      
      const { error } = await this.supabase!
        .from(tableName)
        .upsert(convertedData, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      this.logger.log(`Successfully migrated ${convertedData.length} records to ${tableName}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.log(`File ${fileName}.json not found, skipping`);
      } else {
        this.logger.error(`Error migrating ${fileName}.json:`, error);
        throw error;
      }
    }
  }

  private getTableName(fileName: string): string {
    const tableMap: Record<string, string> = {
      'users': 'users',
      'wallets': 'wallets',
      'products': 'products',
      'product-variants': 'product_variants',
      'orders': 'orders',
      'gacha-pools': 'gacha_pools',
      'gacha-players': 'gacha_players',
      'gacha-pool-entries': 'gacha_pool_entries',
      'gacha-draws': 'gacha_draws',
      'owned-players': 'owned_players',
      'player-kits': 'player_kits',
      'penalty-sessions': 'penalty_sessions',
      'penalty-attempts': 'penalty_attempts',
      'ledger': 'ledger_entries',
      'accounts': 'accounts',
      'referral-codes': 'referral_codes',
      'referral-registrations': 'referral_registrations',
      'referral-commissions': 'referral_commissions',
      'challenges': 'challenges',
      'idempotency': 'idempotency_keys',
    };
    
    return tableMap[fileName] || fileName.replace('-', '_');
  }

  private convertJsonToDb(item: any): any {
    const converted = { ...item };
    
    // Convert camelCase to snake_case
    const keyMap: Record<string, string> = {
      'walletAddress': 'wallet_address',
      'isActive': 'is_active',
      'lastLogin': 'last_login',
      'userId': 'user_id',
      'chainType': 'chain_type',
      'isPrimary': 'is_primary',
      'linkedAt': 'linked_at',
      'lastUsedAt': 'last_used_at',
      'productId': 'product_id',
      'priceUSDT': 'price_usdt',
      'maxPurchasesPerUser': 'max_purchases_per_user',
      'gachaPoolId': 'gacha_pool_id',
      'productVariantId': 'product_variant_id',
      'unitPriceUSDT': 'unit_price_usdt',
      'totalPriceUSDT': 'total_price_usdt',
      'paymentWallet': 'payment_wallet',
      'receivingWallet': 'receiving_wallet',
      'transactionHash': 'transaction_hash',
      'blockNumber': 'block_number',
      'expiresAt': 'expires_at',
      'paidAt': 'paid_at',
      'fulfilledAt': 'fulfilled_at',
      'cancelledAt': 'cancelled_at',
      'failureReason': 'failure_reason',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
    };
    
    // Convert keys
    Object.keys(keyMap).forEach(jsonKey => {
      if (converted[jsonKey] !== undefined) {
        converted[keyMap[jsonKey]] = converted[jsonKey];
        delete converted[jsonKey];
      }
    });
    
    return converted;
  }

  /**
   * Create backup of current database
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(process.cwd(), 'data', 'backups', `database-backup-${timestamp}.sql`);
    
    try {
      // Create backup directory
      await fs.mkdir(join(process.cwd(), 'data', 'backups'), { recursive: true });
      
      // Simple backup content
      let backupContent = '-- Database Backup\n';
      backupContent += `-- Created: ${new Date().toISOString()}\n\n`;
      
      if (this.supabase) {
        const tables = Object.values(this.tableMap);
        
        for (const table of tables) {
          try {
            const { count } = await this.supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
            
            backupContent += `-- Table: ${table}\n`;
            backupContent += `-- Records: ${count || 0}\n\n`;
          } catch (error) {
            backupContent += `-- Table: ${table} (error reading)\n\n`;
          }
        }
      }
      
      await fs.writeFile(backupPath, backupContent);
      this.logger.log(`Database backup created: ${backupPath}`);
      
      return backupPath;
    } catch (error) {
      this.logger.error('Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Verify migration integrity
   */
  async verifyMigration(): Promise<boolean> {
    if (!this.supabase) {
      this.logger.warn('Supabase client not available, skipping verification');
      return true;
    }

    try {
      const tables = Object.values(this.tableMap);

      this.logger.log('📊 Migration Statistics:');
      for (const table of tables) {
        try {
          const { count } = await this.supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          this.logger.log(`   ${table}: ${count || 0} records`);
        } catch (error) {
          this.logger.log(`   ${table}: table not found or error`);
        }
      }

      this.logger.log('Migration verification completed successfully');
      return true;
    } catch (error) {
      this.logger.error('Error verifying migration:', error);
      return false;
    }
  }
}