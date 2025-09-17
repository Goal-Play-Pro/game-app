import { Injectable, ConflictException } from '@nestjs/common';
import { JsonDataStoreService } from '../services/json-data-store.service';
import { BaseEntity } from '../types/base.types';

interface IdempotencyRecord extends BaseEntity {
  key: string;
  userId: string;
  response: any;
}

interface IdempotencyRecord {
  id: string;
  key: string;
  userId: string;
  response: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class IdempotencyService {
  private readonly store: JsonDataStoreService<IdempotencyRecord>;

  constructor() {
    this.store = new JsonDataStoreService<IdempotencyRecord>('idempotency');
  }

  async checkIdempotency(key: string, userId: string): Promise<any> {
    const existing = await this.store.findOne(
      (record: IdempotencyRecord) => record.key === key && record.userId === userId
    );

    if (existing) {
      // Verificar si no ha expirado (24 horas)
      const expirationTime = new Date(existing.createdAt.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() < expirationTime) {
        return existing.response;
      }
    }

    return null;
  }

  async saveIdempotentResponse(key: string, userId: string, response: any): Promise<void> {
    await this.store.create({
      key,
      userId,
      response,
    });
  }

  validateIdempotencyKey(key: string | string[]): boolean {
    if (Array.isArray(key)) {
      return false; // Arrays are not valid idempotency keys
    }
    return typeof key === 'string' && key.length > 0 && key.length <= 255;
  }
}