import { ConfigService } from '@nestjs/config';

const MIN_SECRET_LENGTH = 32;

export const JWT_SECRET_CONFIG_KEY = 'JWT_SECRET';

export function resolveJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>(JWT_SECRET_CONFIG_KEY);
  if (!secret || secret.trim().length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT secret must be defined via ${JWT_SECRET_CONFIG_KEY} and contain at least ${MIN_SECRET_LENGTH} characters`,
    );
  }
  return secret;
}
