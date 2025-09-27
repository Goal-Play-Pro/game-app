import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { DataAdapterService } from './services/data-adapter.service';
import { CryptoService } from './services/crypto.service';
import { LoggerService } from './services/logger.service';
import { SecurityMetricsService } from './services/security-metrics.service';
import { IdempotencyService } from './services/idempotency.service';
import { resolveJwtConfig } from './config/jwt.config';

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
      useFactory: async (configService: ConfigService) => {
        const jwtConfig = resolveJwtConfig(configService);
        return {
          secret: jwtConfig.current.secret,
          signOptions: {
            algorithm: jwtConfig.algorithm,
            audience: jwtConfig.audience,
            issuer: jwtConfig.issuer,
            expiresIn: jwtConfig.expiresIn,
            keyid: jwtConfig.current.kid,
          },
        };
      },
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
