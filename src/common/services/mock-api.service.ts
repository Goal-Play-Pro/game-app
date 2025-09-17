import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataAdapterService } from './data-adapter.service';
import { BaseEntity } from '../types/base.types';

@Injectable()
export class MockApiService {
  private mockData: Map<string, any[]> = new Map();
  private dataAdapter?: DataAdapterService;

  constructor(private configService: ConfigService) {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with sample data
    this.mockData.set('products', [
      {
        id: '1',
        name: 'Pack Tercera División',
        description: 'Comienza tu aventura con jugadores básicos',
        type: 'character_pack',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Pack Primera División',
        description: 'Jugadores de élite para gamers profesionales',
        type: 'character_pack',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    this.mockData.set('product-variants', [
      {
        id: '1',
        productId: '1',
        name: 'Pack Primera División - Nivel 1',
        description: 'Pack de jugadores de primera división nivel básico',
        division: 'primera',
        level: 1,
        priceUSDT: '1000.00',
        isActive: true,
        gachaPoolId: 'pool_primera',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        productId: '1',
        name: 'Pack Primera División - Nivel 5',
        description: 'Pack de jugadores de primera división nivel máximo',
        division: 'primera',
        level: 5,
        priceUSDT: '5000.00',
        isActive: true,
        gachaPoolId: 'pool_primera',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        productId: '2',
        name: 'Pack Segunda División - Nivel 1',
        description: 'Pack de jugadores de segunda división nivel básico',
        division: 'segunda',
        level: 1,
        priceUSDT: '200.00',
        isActive: true,
        gachaPoolId: 'pool_segunda',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '4',
        productId: '2',
        name: 'Pack Segunda División - Nivel 5',
        description: 'Pack de jugadores de segunda división nivel máximo',
        division: 'segunda',
        level: 5,
        priceUSDT: '850.00',
        isActive: true,
        gachaPoolId: 'pool_segunda',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '5',
        productId: '3',
        name: 'Pack Tercera División - Nivel 1',
        description: 'Pack de jugadores de tercera división nivel básico',
        division: 'tercera',
        level: 1,
        priceUSDT: '30.00',
        isActive: true,
        gachaPoolId: 'pool_tercera',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '6',
        productId: '3',
        name: 'Pack Tercera División - Nivel 5',
        description: 'Pack de jugadores de tercera división nivel máximo',
        division: 'tercera',
        level: 5,
        priceUSDT: '130.00',
        isActive: true,
        gachaPoolId: 'pool_tercera',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    this.mockData.set('users', [
      {
        id: 'mock-user-id',
        walletAddress: '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
        chain: 'ethereum',
        isActive: true,
        lastLogin: new Date(),
        metadata: {
          preferences: {
            language: 'en',
            notifications: true
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    this.mockData.set('owned-players', [
      {
        id: 'owned-1',
        userId: 'mock-user-id',
        playerId: 'player-1',
        acquiredAt: new Date().toISOString(),
        currentLevel: 5,
        experience: 250,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    this.mockData.set('penalty-sessions', [
      {
        id: 'session-1',
        hostUserId: 'mock-user-id',
        type: 'single_player',
        status: 'completed',
        hostPlayerId: 'player-1',
        maxRounds: 5,
        currentRound: 6,
        hostScore: 3,
        guestScore: 2,
        winnerId: 'mock-user-id',
        seed: 'mock-seed',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    this.mockData.set('orders', []);
    this.mockData.set('wallets', []);
    this.mockData.set('ledger', []);
    this.mockData.set('challenges', []);
    this.mockData.set('idempotency', []);
    this.mockData.set('referral-codes', []);
    this.mockData.set('referral-registrations', []);
    this.mockData.set('referral-commissions', []);
  }

  async findAll<T extends BaseEntity>(collection: string): Promise<T[]> {
    return this.mockData.get(collection) || [];
  }

  async findById<T extends BaseEntity>(collection: string, id: string): Promise<T | null> {
    const items = this.mockData.get(collection) || [];
    return items.find(item => item.id === id) || null;
  }

  async findOne<T extends BaseEntity>(collection: string, predicate: (item: T) => boolean): Promise<T | null> {
    const items = this.mockData.get(collection) || [];
    return items.find(predicate) || null;
  }

  async findWhere<T extends BaseEntity>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    const items = this.mockData.get(collection) || [];
    return items.filter(predicate);
  }

  async create<T extends BaseEntity>(collection: string, data: Partial<T>): Promise<T> {
    const items = this.mockData.get(collection) || [];
    const newItem = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date(),
      updatedAt: new Date()
    } as T;
    
    items.push(newItem);
    this.mockData.set(collection, items);
    return newItem;
  }

  async update<T extends BaseEntity>(collection: string, id: string, data: Partial<T>): Promise<T> {
    const items = this.mockData.get(collection) || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) {
      throw new Error(`Item with id ${id} not found in ${collection}`);
    }
    
    items[index] = { ...items[index], ...data, updatedAt: new Date() };
    this.mockData.set(collection, items);
    return items[index];
  }

  async delete(collection: string, id: string): Promise<boolean> {
    const items = this.mockData.get(collection) || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return false;
    
    items.splice(index, 1);
    this.mockData.set(collection, items);
    return true;
  }

  async count(collection: string): Promise<number> {
    const items = this.mockData.get(collection) || [];
    return items.length;
  }

  async exists(collection: string, id: string): Promise<boolean> {
    const items = this.mockData.get(collection) || [];
    return items.some(item => item.id === id);
  }
}