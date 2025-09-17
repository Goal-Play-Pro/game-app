import { Injectable, Logger, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(
    @Inject('SUPABASE_CLIENT')
    private supabase: SupabaseClient | null,
  ) {}

  /**
   * Execute raw SQL query
   */
  async query(sql: string, parameters?: any[]): Promise<any> {
    if (!this.supabase) {
      throw new Error('Supabase client not available');
    }

    try {
      const { data, error } = await this.supabase.rpc('execute_sql', {
        query: sql,
        params: parameters || []
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      this.logger.error('Database query failed:', error);
      throw error;
    }
  }

  /**
   * Check database connection
   */
  async isConnected(): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);
      
      return !error;
    } catch (error) {
      this.logger.error('Database connection failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<any> {
    if (!this.supabase) {
      return [];
    }

    try {
      const tables = [
        'users', 'wallets', 'products', 'product_variants', 'orders',
        'gacha_pools', 'gacha_players', 'gacha_pool_entries', 'gacha_draws',
        'owned_players', 'player_kits', 'penalty_sessions', 'penalty_attempts',
        'ledger_entries', 'accounts', 'referral_codes', 'referral_registrations',
        'referral_commissions', 'challenges', 'idempotency_keys'
      ];

      const stats = [];
      
      for (const table of tables) {
        try {
          const { count, error } = await this.supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (!error) {
            stats.push({
              tablename: table,
              live_tuples: count || 0
            });
          }
        } catch (error) {
          // Table might not exist yet
          stats.push({
            tablename: table,
            live_tuples: 0
          });
        }
      }
      
      return stats;
    } catch (error) {
      this.logger.error('Error getting database stats:', error);
      return [];
    }
  }

  /**
   * Clean up expired records
   */
  async cleanupExpiredRecords(): Promise<void> {
    if (!this.supabase) {
      return;
    }

    try {
      // Clean up expired challenges
      await this.supabase
        .from('challenges')
        .delete()
        .lt('expires_at', new Date().toISOString());

      // Clean up expired idempotency keys
      await this.supabase
        .from('idempotency_keys')
        .delete()
        .lt('expires_at', new Date().toISOString());

      this.logger.log('Expired records cleaned up successfully');
    } catch (error) {
      this.logger.error('Error cleaning up expired records:', error);
    }
  }
}