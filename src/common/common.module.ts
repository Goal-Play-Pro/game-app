import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DataAdapterService } from './services/data-adapter.service';
import { CryptoService } from './services/crypto.service';
import { LoggerService } from './services/logger.service';
import { SecurityMetricsService } from './services/security-metrics.service';
import { IdempotencyService } from './services/idempotency.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      expandVariables: true,
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  providers: [
    DataAdapterService,
    CryptoService,
    LoggerService,
    SecurityMetricsService,
    IdempotencyService,
  ],
  exports: [
    ConfigModule,
    JwtModule,
    DataAdapterService,
    CryptoService,
    LoggerService,
    SecurityMetricsService,
    IdempotencyService,
  ],
})
export class CommonModule {}
