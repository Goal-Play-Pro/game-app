import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockApiService } from './mock-api.service';
import { DatabaseApiService } from './database-api.service';
import { BaseEntity } from '../types/base.types';

/**
 * Data Adapter Service - Abstraction layer that switches between JSON and Database
 * Maintains the exact same interface as MockApiService
 */
@Injectable()
export class DataAdapterService {
  private readonly logger = new Logger(DataAdapterService.name);
  private readonly useDatabase: boolean;

  constructor(
    private configService: ConfigService,
    private mockApiService: MockApiService,
    private databaseApiService: DatabaseApiService,
  ) {
    this.useDatabase = this.configService.get<string>('USE_DATABASE') === 'true';
    this.logger.log(`Data storage mode: ${this.useDatabase ? 'Database' : 'JSON Files'}`);
  }

  /**
   * Find all records
   */
  async findAll<T extends BaseEntity>(collection: string): Promise<T[]> {
    if (this.useDatabase) {
      return this.databaseApiService.findAll<T>(collection);
    } else {
      return this.mockApiService.findAll<T>(collection);
    }
  }

  /**
   * Find by ID
   */
  async findById<T extends BaseEntity>(collection: string, id: string): Promise<T | null> {
    if (this.useDatabase) {
      return this.databaseApiService.findById<T>(collection, id);
    } else {
      return this.mockApiService.findById<T>(collection, id);
    }
  }

  /**
   * Find one with predicate
   */
  async findOne<T extends BaseEntity>(collection: string, predicate: (item: T) => boolean): Promise<T | null> {
    if (this.useDatabase) {
      return this.databaseApiService.findOne<T>(collection, predicate);
    } else {
      return this.mockApiService.findOne<T>(collection, predicate);
    }
  }

  /**
   * Find where with predicate
   */
  async findWhere<T extends BaseEntity>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    if (this.useDatabase) {
      return this.databaseApiService.findWhere<T>(collection, predicate);
    } else {
      return this.mockApiService.findWhere<T>(collection, predicate);
    }
  }

  /**
   * Create new record
   */
  async create<T extends BaseEntity>(collection: string, data: Partial<T>): Promise<T> {
    if (this.useDatabase) {
      return this.databaseApiService.create<T>(collection, data);
    } else {
      return this.mockApiService.create<T>(collection, data);
    }
  }

  /**
   * Update record
   */
  async update<T extends BaseEntity>(collection: string, id: string, data: Partial<T>): Promise<T> {
    if (this.useDatabase) {
      return this.databaseApiService.update<T>(collection, id, data);
    } else {
      return this.mockApiService.update<T>(collection, id, data);
    }
  }

  /**
   * Delete record
   */
  async delete(collection: string, id: string): Promise<boolean> {
    if (this.useDatabase) {
      return this.databaseApiService.delete(collection, id);
    } else {
      return this.mockApiService.delete(collection, id);
    }
  }

  /**
   * Count records
   */
  async count(collection: string): Promise<number> {
    if (this.useDatabase) {
      return this.databaseApiService.count(collection);
    } else {
      return this.mockApiService.count(collection);
    }
  }

  /**
   * Check if record exists
   */
  async exists(collection: string, id: string): Promise<boolean> {
    if (this.useDatabase) {
      return this.databaseApiService.exists(collection, id);
    } else {
      return this.mockApiService.exists(collection, id);
    }
  }

  /**
   * Switch to database mode
   */
  switchToDatabase(): void {
    process.env.USE_DATABASE = 'true';
    this.logger.log('Switched to database mode');
  }

  /**
   * Switch to JSON mode
   */
  switchToJson(): void {
    process.env.USE_DATABASE = 'false';
    this.logger.log('Switched to JSON mode');
  }

  /**
   * Get current storage mode
   */
  getStorageMode(): 'database' | 'json' {
    return this.useDatabase ? 'database' : 'json';
  }
}