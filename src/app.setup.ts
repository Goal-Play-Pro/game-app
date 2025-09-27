import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet, { HelmetOptions } from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { randomBytes } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

interface ConfigureResult {
  isProduction: boolean;
  corsOrigins: string[];
}

export const configureApp = async (app: INestApplication): Promise<ConfigureResult> => {
  const configService = app.get(ConfigService);
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

  return {
    isProduction,
    corsOrigins: Array.from(corsOrigins),
  };
};

