import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { CryptoService } from '@common/services/crypto.service';
import { LoggerService } from '@common/services/logger.service';
import { WalletService } from '@wallet/wallet.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let cryptoService: CryptoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-value'),
          },
        },
        {
          provide: CryptoService,
          useValue: {
            generateChallenge: jest.fn().mockReturnValue('mock-challenge'),
            createSiweMessage: jest.fn().mockReturnValue('mock-message'),
            verifySiweSignature: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            auditLog: jest.fn(),
          },
        },
        {
          provide: WalletService,
          useValue: {
            linkWallet: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSiweChallenge', () => {
    it('should create a valid SIWE challenge', async () => {
      const dto = {
        address: '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
        chainId: 1,
        statement: 'Test statement',
      };

      const result = await service.createSiweChallenge(dto);

      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('expiresAt');
      expect(result).toHaveProperty('message');
      expect(cryptoService.generateChallenge).toHaveBeenCalled();
    });
  });
});