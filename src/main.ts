import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { SeedService } from './database/seed/seed.service';
import { configureApp } from './app.setup';

const SWAGGER_FAVICON_DATA_URL =
  "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2032%2032%27%3E%3Crect%20width%3D%2732%27%20height%3D%2732%27%20rx%3D%276%27%20fill%3D%27%2300b894%27/%3E%3Ctext%20x%3D%2716%27%20y%3D%2721%27%20font-size%3D%2718%27%20font-family%3D%27Arial%2C%20sans-serif%27%20text-anchor%3D%27middle%27%20fill%3D%27white%27%3EG%3C/text%3E%3C/svg%3E";

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3001);

    await configureApp(app);

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Goal Play API')
      .setDescription('Backend completo para Goal Play - Plataforma de gaming de fútbol con blockchain')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('app', 'Endpoints básicos de la aplicación')
      .addTag('auth', 'Autenticación con wallets')
      .addTag('shop', 'Tienda y productos')
      .addTag('orders', 'Órdenes y pagos')
      .addTag('inventory', 'Inventario de jugadores')
      .addTag('penalty', 'Gameplay de penalties')
      .addTag('statistics', 'Estadísticas y leaderboard')
      .addTag('referral', 'Sistema de referidos')
      .addServer(`http://localhost:${port}`, 'Servidor de desarrollo')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Goal Play API Documentation',
      customfavIcon: SWAGGER_FAVICON_DATA_URL,
    });
    await app.listen(port);
    // Seed database on startup
    try {
      const seedService = app.get(SeedService);
      await seedService.seedDatabase();
    } catch (error) {
      logger.warn('⚠️ Database seeding failed (this is normal if data already exists):', error.message);
    }

    
    logger.log(`🚀 Goal Play API ejecutándose en: http://localhost:${port}`);
    logger.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
    logger.log(`🏥 Health Check: http://localhost:${port}/health`);
    logger.log(`🗄️ Base de datos: ${configService.get('DB_TYPE', 'sqlite').toUpperCase()} con TypeORM`);
    logger.log(`🔧 Environment: ${configService.get('NODE_ENV', 'development')}`);
    logger.log(`💰 Payment verification: Real blockchain verification`);
    logger.log(`🎲 Gacha system: ENABLED`);
    logger.log(`👥 Referral system: ENABLED`);

  } catch (error) {
    logger.error('❌ Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('💥 Error crítico al iniciar:', error);
  process.exit(1);
});
