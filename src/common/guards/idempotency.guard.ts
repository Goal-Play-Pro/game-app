import { Injectable, CanActivate, ExecutionContext, ConflictException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdempotencyService } from '../services/idempotency.service';
import { IDEMPOTENT_KEY } from '../decorators/idempotent.decorator';
import { Request, Response } from 'express';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private idempotencyService: IdempotencyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isIdempotent = this.reflector.getAllAndOverride<boolean>(IDEMPOTENT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isIdempotent) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();
    const response = context.switchToHttp().getResponse<Response>();
    const idempotencyKey = request.headers['idempotency-key'] as string;

    if (!idempotencyKey || Array.isArray(idempotencyKey)) {
      throw new ConflictException('Idempotency-Key header requerido');
    }

    if (!this.idempotencyService.validateIdempotencyKey(idempotencyKey)) {
      throw new ConflictException('Idempotency-Key inválido');
    }

    const userId = request.user?.sub;
    if (!userId) {
      throw new ConflictException('Usuario no autenticado');
    }

    const existingResponse = await this.idempotencyService.checkIdempotency(
      idempotencyKey,
      userId,
    );

    if (existingResponse) {
      response.status(200).json(existingResponse);
      return false;
    }

    return true;
  }
}