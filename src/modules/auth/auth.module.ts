import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SiweStrategy } from './strategies/siwe.strategy';
import { SolanaStrategy } from './strategies/solana.strategy';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [WalletModule],
  controllers: [AuthController],
  providers: [AuthService, SiweStrategy, SolanaStrategy],
  exports: [AuthService],
})
export class AuthModule {}