import { Injectable, Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { BaseEntity } from '../types/base.types';

/**
 * Database API Service - Replacement for MockApiService using Supabase
 * Maintains the same interface but uses real database operations
 */
@Injectable()
export class DatabaseApiService {
  private readonly logger = new Logger(DatabaseApiService.name);
  private readonly tableMap: Record<string, string> = {
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

  constructor(
    @Inject('SUPABASE_CLIENT')
    private supabase: SupabaseClient | null,
  ) {}

  private getTableName(collection: string): string {
    return this.tableMap[collection] || collection.replace('-', '_');
  }

  private convertJsonToDb(data: any): any {
    const converted = { ...data };
    
    // Convert camelCase to snake_case for database
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

    Object.keys(keyMap).forEach(jsonKey => {
      if (converted[jsonKey] !== undefined) {
        converted[keyMap[jsonKey]] = converted[jsonKey];
        delete converted[jsonKey];
      }
    });

    return converted;
  }

  private convertDbToJson(data: any): any {
    const converted = { ...data };
    
    // Convert snake_case to camelCase for JSON response
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

    Object.keys(keyMap).forEach(dbKey => {
      if (converted[dbKey] !== undefined) {
        converted[keyMap[dbKey]] = converted[dbKey];
        delete converted[dbKey];
      }
    });

    return converted;
  }

  /**
   * Find all records - equivalent to MockApiService.findAll()
   */
  async findAll<T extends BaseEntity>(collection: string): Promise<T[]> {
    if (!this.supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const tableName = this.getTableName(collection);
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map((row: any) => this.convertDbToJson(row));
    } catch (error) {
      this.logger.error(`Error finding all ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Find by ID - equivalent to MockApiService.findById()
   */
  async findById<T extends BaseEntity>(collection: string, id: string): Promise<T | null> {
    if (!this.supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const tableName = this.getTableName(collection);
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data ? this.convertDbToJson(data) : null;
    } catch (error) {
      this.logger.error(`Error finding ${collection} by ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Find one with predicate - equivalent to MockApiService.findOne()
   */
  async findOne<T extends BaseEntity>(collection: string, predicate: (item: T) => boolean): Promise<T | null> {
    try {
      const allRecords = await this.findAll<T>(collection);
      return allRecords.find(predicate) || null;
    } catch (error) {
      this.logger.error(`Error finding one ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Find where - equivalent to MockApiService.findWhere()
   */
  async findWhere<T extends BaseEntity>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    try {
      const allRecords = await this.findAll<T>(collection);
      return allRecords.filter(predicate);
    } catch (error) {
      this.logger.error(`Error finding ${collection} with conditions:`, error);
      throw error;
    }
  }

  /**
   * Create new record - equivalent to MockApiService.create()
   */
  async create<T extends BaseEntity>(collection: string, data: Partial<T>): Promise<T> {
    if (!this.supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const tableName = this.getTableName(collection);
      const dbData = this.convertJsonToDb(data);
      
      // Generate ID if not provided
      if (!dbData.id) {
        dbData.id = require('uuid').v4();
      }
      
      // Set timestamps
      const now = new Date().toISOString();
      dbData.created_at = now;
      dbData.updated_at = now;

      const { data: result, error } = await this.supabase
        .from(tableName)
        .insert(dbData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.convertDbToJson(result);
    } catch (error) {
      this.logger.error(`Error creating ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Update record - equivalent to MockApiService.update()
   */
  async update<T extends BaseEntity>(collection: string, id: string, data: Partial<T>): Promise<T> {
    if (!this.supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const tableName = this.getTableName(collection);
      const dbData = this.convertJsonToDb(data);
      
      // Set updated timestamp
      dbData.updated_at = new Date().toISOString();

      const { data: result, error } = await this.supabase
        .from(tableName)
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!result) {
        throw new Error(`Record with id ${id} not found in ${collection}`);
      }

      return this.convertDbToJson(result);
    } catch (error) {
      this.logger.error(`Error updating ${collection} ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete record - equivalent to MockApiService.delete()
   */
  async delete(collection: string, id: string): Promise<boolean> {
    if (!this.supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const tableName = this.getTableName(collection);
      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error deleting ${collection} ${id}:`, error);
      return false;
    }
  }

  /**
   * Count records - equivalent to MockApiService.count()
   */
  async count(collection: string): Promise<number> {
    if (!this.supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const tableName = this.getTableName(collection);
      const { count, error } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      this.logger.error(`Error counting ${collection}:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists - equivalent to MockApiService.exists()
   */
  async exists(collection: string, id: string): Promise<boolean> {
    if (!this.supabase) {
      throw new Error('Database connection not available');
    }

    try {
      const tableName = this.getTableName(collection);
      const { data, error } = await this.supabase
        .from(tableName)
        .select('id')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      this.logger.error(`Error checking existence of ${collection} ${id}:`, error);
      return false;
    }
  }
}