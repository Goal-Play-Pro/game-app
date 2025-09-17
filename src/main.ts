import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Global configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // CORS configuration
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Football Game Platform API')
    .setDescription(`
      Backend robusto para plataforma de juegos de fútbol con:
      • Autenticación multi-chain con wallets
      • Sistema de pagos on-chain con USDT
      • Sistema gacha para adquisición de jugadores
      • Motor de penalty shootout determinístico
      • Gestión completa de inventario y progresión
      • Contabilidad de doble entrada
    `)
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('app', 'Endpoints básicos de la aplicación')
    .addTag('Auth', 'Autenticación con wallets')
    .addTag('wallet', 'Gestión de wallets')
    .addTag('Shop', 'Sistema de tienda')
    .addTag('Orders', 'Gestión de órdenes')
    .addTag('Gacha', 'Sistema gacha')
    .addTag('Inventory', 'Gestión de inventario')
    .addTag('Penalty', 'Gameplay de penales')
    .addTag('ledger', 'Sistema contable')
    .addTag('Admin', 'Administración')
    .addServer(`http://localhost:${port}`, 'Servidor de desarrollo')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Football Gaming Platform API',
    customfavIcon: '/favicon.ico',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  await app.listen(port);
  
  // Logs informativos
  logger.log(`🚀 Aplicación ejecutándose en: http://localhost:${port}`);
  logger.log(`📚 Documentación Swagger: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health Check: http://localhost:${port}/health`);
  logger.log(`📊 Status: http://localhost:${port}/status`);
  logger.log(`🔍 API Info: http://localhost:${port}/`);
  logger.log(`📋 Endpoints disponibles:`);
  logger.log(`   • GET / - Información de la API`);
  logger.log(`   • GET /health - Health check`);
  logger.log(`   • GET /status - Estado detallado`);
  logger.log(`   • GET /version - Versión de la API`);
  logger.log(`   • GET /api/docs - Documentación Swagger`);
}

bootstrap().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exit(1);
});