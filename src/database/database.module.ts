import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import { DatabaseService } from './database.service';
import { MigrationService } from './migration.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'SUPABASE_CLIENT',
      useFactory: (configService: ConfigService) => {
        const supabaseUrl = configService.get<string>('VITE_SUPABASE_URL');
        const supabaseKey = configService.get<string>('VITE_SUPABASE_ANON_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase credentials not found, database features will be limited');
          return null;
        }
        
        return createClient(supabaseUrl, supabaseKey);
      },
      inject: [ConfigService],
    },
    DatabaseService,
    MigrationService,
  ],
  exports: [DatabaseService, MigrationService, 'SUPABASE_CLIENT'],
})
export class DatabaseModule {}