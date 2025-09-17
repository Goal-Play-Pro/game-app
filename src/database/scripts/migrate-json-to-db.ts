import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../../app.module';
import { MigrationService } from '../migration.service';
import { DatabaseService } from '../database.service';

/**
 * Script to migrate data from JSON files to database
 * Run with: npm run migrate:json-to-db
 */
async function migrateJsonToDatabase() {
  const logger = new Logger('JsonToDbMigration');
  
  try {
    logger.log('🚀 Starting JSON to Database migration...');
    
    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule);
    
    // Get services
    const migrationService = app.get(MigrationService);
    const databaseService = app.get(DatabaseService);
    
    // Check database connection
    const isConnected = await databaseService.isConnected();
    if (!isConnected) {
      logger.warn('Database connection not available, please connect to Supabase first');
      logger.log('💡 Click "Connect to Supabase" button in the top right to set up your database');
      await app.close();
      return;
    }
    logger.log('✅ Database connection verified');
    
    // Run database migrations first
    logger.log('📋 Running database migrations...');
    await migrationService.runMigrations();
    logger.log('✅ Database migrations completed');
    
    // Create backup before migration
    logger.log('💾 Creating database backup...');
    const backupPath = await migrationService.createBackup();
    logger.log(`✅ Backup created: ${backupPath}`);
    
    // Migrate JSON data
    logger.log('📦 Migrating JSON data to database...');
    await migrationService.migrateFromJson();
    logger.log('✅ JSON data migration completed');
    
    // Verify migration
    logger.log('🔍 Verifying migration integrity...');
    const isValid = await migrationService.verifyMigration();
    if (!isValid) {
      throw new Error('Migration verification failed');
    }
    logger.log('✅ Migration verification passed');
    
    // Get final statistics
    const stats = await databaseService.getStats();
    logger.log('📊 Migration Statistics:');
    stats.forEach((stat: any) => {
      logger.log(`   ${stat.tablename}: ${stat.live_tuples} records`);
    });
    
    logger.log('🎉 JSON to Database migration completed successfully!');
    logger.log('💡 To switch to database mode, set USE_DATABASE=true in your .env file');
    
    await app.close();
    process.exit(0);
    
  } catch (error) {
    logger.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateJsonToDatabase();
}

export { migrateJsonToDatabase };