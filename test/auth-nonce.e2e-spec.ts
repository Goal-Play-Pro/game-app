import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Response } from 'express';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { CryptoService } from '../src/common/services/crypto.service';
import { User } from '../src/database/entities/user.entity';
import { Challenge } from '../src/database/entities/challenge.entity';
import { AUTH_COOKIE_NAME } from '../src/modules/auth/auth.constants';
import { LoggerService } from '../src/common/services/logger.service';
import { SecurityMetricsService } from '../src/common/services/security-metrics.service';

describe('AuthController nonce lifecycle', () => {
  const address = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
  let controller: AuthController;
  let challengeRepo: { save: jest.Mock; findOne: jest.Mock; update: jest.Mock; reset: () => void };
  let userRepo: { findOne: jest.Mock; save: jest.Mock; update: jest.Mock; reset: () => void };
  let logger: { auditLog: jest.Mock; warn: jest.Mock } & Partial<LoggerService>;
  let metrics: {
    recordLoginSuccess: jest.Mock;
    recordLoginFailure: jest.Mock;
    recordLogout: jest.Mock;
    toPrometheus?: jest.Mock;
  } & Partial<SecurityMetricsService>;

  beforeEach(() => {
    let challengeRecord: Challenge | null = null;
    challengeRepo = {
      save: jest.fn(async (data: Partial<Challenge>) => {
        challengeRecord = Object.assign(new Challenge(), {
          id: 'challenge-1',
          nonce: data.nonce ?? '',
          address: (data.address ?? '').toLowerCase(),
          chainType: data.chainType ?? 'ethereum',
          message: data.message ?? '',
          expiresAt: data.expiresAt ?? new Date(Date.now() + 600000),
          used: data.used ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return challengeRecord;
      }),
      findOne: jest.fn(async ({ where: { nonce } }: { where: { nonce: string } }) =>
        challengeRecord && challengeRecord.nonce === nonce ? challengeRecord : null,
      ),
      update: jest.fn(async ({ id, used }: { id: string; used?: boolean }, delta: Partial<Challenge>) => {
        if (!challengeRecord || challengeRecord.id !== id || (used !== undefined && challengeRecord.used !== used)) {
          return { affected: 0 };
        }
        Object.assign(challengeRecord, delta, { updatedAt: new Date() });
        return { affected: 1 };
      }),
      reset: () => {
        challengeRecord = null;
      },
    };

    let userRecord: User | null = null;
    userRepo = {
      findOne: jest.fn(async ({ where }: { where: Partial<User> }) => {
        if (!userRecord) return null;
        if (where.walletAddress && userRecord.walletAddress === where.walletAddress) return userRecord;
        if (where.id && userRecord.id === where.id) return userRecord;
        return null;
      }),
      save: jest.fn(async (data: Partial<User>) => {
        userRecord = Object.assign(new User(), {
          id: 'user-1',
          walletAddress: data.walletAddress ?? '',
          chain: data.chain ?? 'ethereum',
          isActive: data.isActive ?? true,
          lastLogin: data.lastLogin ?? null,
          metadata: data.metadata ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        return userRecord;
      }),
      update: jest.fn(async (_id: string, delta: Partial<User>) => {
        if (userRecord) Object.assign(userRecord, delta, { updatedAt: new Date() });
      }),
      reset: () => {
        userRecord = null;
      },
    };
    const crypto = { verifySiweSignature: jest.fn().mockResolvedValue(true) } as unknown as CryptoService;
    const jwt = { sign: jest.fn().mockReturnValue('token') } as unknown as JwtService;
    logger = {
      auditLog: jest.fn().mockResolvedValue(undefined),
      warn: jest.fn(),
    };
    metrics = {
      recordLoginSuccess: jest.fn(),
      recordLoginFailure: jest.fn(),
      recordLogout: jest.fn(),
    };
    const service = new AuthService(
      jwt,
      crypto,
      logger as unknown as LoggerService,
      metrics as unknown as SecurityMetricsService,
      userRepo as unknown as Repository<User>,
      challengeRepo as unknown as Repository<Challenge>,
    );
    controller = new AuthController(service, logger as unknown as LoggerService, metrics as unknown as SecurityMetricsService);
  });

  it('rejects replaying a consumed nonce', async () => {
    const res = createMockResponse();
    const req = { ip: '127.0.0.3' };
    const challenge = await controller.createSiweChallenge({ address, chainId: 1, statement: 'Sign in' });
    expect(challenge).toHaveProperty('nonce');

    const first = await controller.verifySiweSignature({ message: challenge.message, signature: '0xsignature' }, req as any, res as unknown as Response);
    expect(first).toHaveProperty('userId');
    expect(res.cookies[AUTH_COOKIE_NAME]).toBeDefined();

    await expect(
      controller.verifySiweSignature({ message: challenge.message, signature: '0xsignature' }, req as any, res as unknown as Response),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

interface MockResponse {
  cookies: Record<string, { value: string; options: any }>;
  cookie: jest.Mock;
  clearCookie: jest.Mock;
}

const createMockResponse = (): MockResponse => {
  const storage: Record<string, { value: string; options: any }> = {};
  return {
    cookies: storage,
    cookie: jest.fn((name: string, value: string, options: any) => {
      storage[name] = { value, options };
    }),
    clearCookie: jest.fn((name: string) => {
      delete storage[name];
    }),
  };
};
