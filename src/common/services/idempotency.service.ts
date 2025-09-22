import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyKey } from '../../database/entities/idempotency-key.entity';

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(IdempotencyKey)
    private idempotencyRepository: Repository<IdempotencyKey>,
  ) {}

  async checkIdempotency(key: string, userId: string): Promise<any> {
    const existing = await this.idempotencyRepository.findOne({
      where: { key, userId }
    });

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
    await this.idempotencyRepository.save({
      key,
      userId,
      response: JSON.stringify(response),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  }

  validateIdempotencyKey(key: string | string[]): boolean {
    if (Array.isArray(key)) {
      return false;
    }
    return typeof key === 'string' && key.length > 0 && key.length <= 255;
  }
}