import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { SeedService } from './database/seed/seed.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug'],
    });

    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3001);

    // Security middleware
    app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false,
    }));
    app.use(compression());

    // Global configuration
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // CORS configuration
    app.enableCors({
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        configService.get('FRONTEND_URL', ''),
        configService.get('CORS_ORIGIN', ''),
      ].filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
    });

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
      customfavIcon: 'https://photos.pinksale.finance/file/pinksale-logo-upload/1756173488726-1bb87d41d15fe27b500a4bfcde01bb0e.png',
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