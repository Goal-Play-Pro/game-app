import { Test, TestingModule } from '@nestjs/testing';
import { GachaService } from './gacha.service';
import { LoggerService } from '@common/services/logger.service';

describe('GachaService', () => {
  let service: GachaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GachaService,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            auditLog: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GachaService>(GachaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSeededRNG', () => {
    it('should generate deterministic random numbers', () => {
      const rng1 = service['createSeededRNG']('test-seed');
      const rng2 = service['createSeededRNG']('test-seed');
      
      expect(rng1()).toBe(rng2());
    });

    it('should generate different sequences for different seeds', () => {
      const rng1 = service['createSeededRNG']('seed-1');
      const rng2 = service['createSeededRNG']('seed-2');
      
      expect(rng1()).not.toBe(rng2());
    });
  });
});