import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { resolveJwtConfig, ResolvedJwtConfig } from '../../../common/config/jwt.config';

const decodeJwtHeader = (token: string): { alg?: string; kid?: string } => {
  const [headerPart] = token.split('.');
  if (!headerPart) {
    throw new Error('Malformed JWT: missing header segment');
  }

  try {
    const json = Buffer.from(headerPart, 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch (error) {
    throw new Error('Malformed JWT: invalid header encoding');
  }
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly jwtConfig: ResolvedJwtConfig;

  constructor(private readonly configService: ConfigService) {
    const jwtConfig = resolveJwtConfig(configService);
    const secretsByKid = new Map<string, string>([
      [jwtConfig.current.kid, jwtConfig.current.secret],
    ]);

    if (jwtConfig.previous) {
      secretsByKid.set(jwtConfig.previous.kid, jwtConfig.previous.secret);
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (_request, rawToken, done) => {
        try {
          const header = decodeJwtHeader(rawToken);
          if (!header.alg) {
            throw new Error('JWT missing alg header');
          }
          if (header.alg !== jwtConfig.algorithm) {
            throw new Error('Unexpected JWT algorithm');
          }

          const kid = header.kid ?? jwtConfig.current.kid;
          const secret = secretsByKid.get(kid);
          if (!secret) {
            throw new Error('Unknown JWT key id');
          }

          return done(null, secret);
        } catch (error) {
          return done(error as Error, null);
        }
      },
      algorithms: [jwtConfig.algorithm],
      audience: jwtConfig.audience,
      issuer: jwtConfig.issuer,
      clockTolerance: jwtConfig.clockTolerance,
    });

    this.jwtConfig = jwtConfig;
  }

  async validate(payload: any) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid token payload');
    }

    if (payload.aud !== this.jwtConfig.audience) {
      throw new UnauthorizedException('Invalid token audience');
    }

    if (payload.iss !== this.jwtConfig.issuer) {
      throw new UnauthorizedException('Invalid token issuer');
    }

    if (typeof payload.iat !== 'number') {
      throw new UnauthorizedException('Invalid token timestamp');
    }

    const now = Math.floor(Date.now() / 1000) + this.jwtConfig.clockTolerance;
    if (payload.iat > now) {
      throw new UnauthorizedException('Token issued in the future');
    }

    if (typeof payload.exp !== 'number' || payload.exp <= payload.iat) {
      throw new UnauthorizedException('Invalid token expiration');
    }

    return {
      userId: payload.sub,
      wallet: payload.wallet,
      chainType: payload.chainType,
    };
  }
}
