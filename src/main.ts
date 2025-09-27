import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet, { HelmetOptions } from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
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
    const nodeEnv = configService.get('NODE_ENV', 'development');
    const isProduction = nodeEnv === 'production';

    if (isProduction) {
      ['FRONTEND_URL', 'CORS_ORIGIN'].forEach((envKey) => {
        if (!configService.get(envKey)) {
          throw new Error(`${envKey} must be configured in production`);
        }
      });
    }

    const expressInstance = app.getHttpAdapter().getInstance();
    expressInstance.set('trust proxy', 1);

    if (isProduction) {
      app.use((req: Request, res: Response, next: NextFunction) => {
        const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
        if (proto !== 'https') {
          const host = req.get('host');
          if (host) {
            return res.redirect(308, `https://${host}${req.originalUrl}`);
          }
        }
        return next();
      });
    }

    app.use((req: Request, res: Response, next: NextFunction) => {
      res.locals.cspNonce = randomBytes(16).toString('base64');
      next();
    });

    // Security middleware
    const parseOrigin = (value?: string): string | undefined => {
      if (!value) {
        return undefined;
      }
      try {
        const normalized = value.startsWith('http') ? value : `https://${value}`;
        return new URL(normalized).origin;
      } catch {
        return undefined;
      }
    };

    const frontendOrigin = parseOrigin(configService.get('FRONTEND_URL'));
    const corsOrigin = parseOrigin(configService.get('CORS_ORIGIN'));

    type CSPDirective = Array<string | ((req: Request, res: Response) => string)>;

    const cspDirectives: Record<string, CSPDirective> = {
      "default-src": ["'self'"],
      "object-src": ["'none'"],
      "img-src": ["'self'", 'data:', 'https://photos.pinksale.finance'],
      "style-src": ["'self'"],
      "font-src": ["'self'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'self'"],
      "upgrade-insecure-requests": [],
    };

    const connectSrc = new Set<string>(["'self'"]);
    [frontendOrigin, corsOrigin].forEach((origin) => {
      if (origin) {
        connectSrc.add(origin);
      }
    });
    cspDirectives['connect-src'] = Array.from(connectSrc);
    cspDirectives['script-src'] = [
      "'self'",
      (req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`,
    ];

    const helmetOptions: HelmetOptions = {
      contentSecurityPolicy: {
        useDefaults: false,
        directives: cspDirectives,
      },
      referrerPolicy: {
        policy: 'no-referrer',
      },
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      frameguard: {
        action: 'sameorigin',
      },
    };

    if (!isProduction) {
      helmetOptions.crossOriginEmbedderPolicy = false;
    }

    app.use(helmet(helmetOptions));
    app.use(compression());
    app.use(cookieParser());

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
    const corsOrigins = new Set<string>([
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:3001',
    ]);
    [frontendOrigin, corsOrigin].forEach((origin) => {
      if (origin) {
        corsOrigins.add(origin);
      }
    });

    app.enableCors({
      origin: Array.from(corsOrigins),
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
