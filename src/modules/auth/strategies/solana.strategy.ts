import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class SolanaStrategy {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {}

  async validate(payload: any) {
    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      return null;
    }
    return { userId: payload.sub, wallet: payload.wallet, chainType: payload.chainType };
  }
}