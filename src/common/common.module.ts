import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MockApiService } from './services/mock-api.service';
import { DatabaseApiService } from './services/database-api.service';
import { DataAdapterService } from './services/data-adapter.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  providers: [
    MockApiService, 
    DatabaseApiService,
    JwtAuthGuard,
    {
      provide: DataAdapterService,
      useFactory: (
        configService: ConfigService,
        mockApiService: MockApiService,
        databaseApiService: DatabaseApiService,
      ) => {
        return new DataAdapterService(configService, mockApiService, databaseApiService);
      },
      inject: [ConfigService, MockApiService, DatabaseApiService],
    },
  ],
  exports: [JwtModule, DataAdapterService, JwtAuthGuard],
})
export class CommonModule {}