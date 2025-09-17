import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { Wallet } from './entities/wallet.entity';
import { LinkWalletDto } from './dto/wallet.dto';
import { ChainType } from '../../common/types/base.types';

@Injectable()
export class WalletService {
  constructor(private dataAdapter: DataAdapterService) {}

  async linkWallet(userId: string, address: string, dto?: LinkWalletDto): Promise<Wallet> {
    const normalizedAddress = address.toLowerCase();

    // Check if wallet is already linked to any user
    const existingWallet = await this.dataAdapter.findOne('wallets', (w: Wallet) => w.address === normalizedAddress);

    if (existingWallet) {
      throw new ConflictException('Wallet already linked to another user');
    }

    // Get user's existing wallets
    const userWallets = await this.dataAdapter.findWhere('wallets', (w: Wallet) => w.userId === userId && w.isActive);
    const isPrimary = userWallets.length === 0;

    const wallet = await this.dataAdapter.create('wallets', {
      userId,
      address: normalizedAddress,
      chainType: dto?.chainType || ChainType.ETHEREUM,
      isPrimary,
      isActive: true,
      linkedAt: new Date().toISOString(),
    });

    console.log(`Wallet linked: ${normalizedAddress} for user ${userId}`);

    return wallet;
  }

  async unlinkWallet(userId: string, address: string): Promise<void> {
    const normalizedAddress = address.toLowerCase();
    
    const wallet = await this.dataAdapter.findOne('wallets', (w: Wallet) => w.userId === userId && w.address === normalizedAddress);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.isPrimary) {
      const otherWallets = await this.dataAdapter.findWhere('wallets',
        (w: Wallet) => w.userId === userId && w.id !== wallet.id && w.isActive
      );

      if (otherWallets.length === 0) {
        throw new BadRequestException('Cannot unlink primary wallet without setting another as primary');
      }

      // Set first available wallet as primary
      await this.dataAdapter.update('wallets', otherWallets[0].id, { isPrimary: true });
    }

    await this.dataAdapter.delete('wallets', wallet.id);

    console.log(`Wallet unlinked: ${normalizedAddress} for user ${userId}`);
  }

  async setPrimaryWallet(userId: string, address: string): Promise<Wallet> {
    const normalizedAddress = address.toLowerCase();
    
    const wallet = await this.dataAdapter.findOne('wallets', (w: Wallet) => w.userId === userId && w.address === normalizedAddress && w.isActive);

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Remove primary flag from other wallets
    const userWallets = await this.dataAdapter.findWhere('wallets', (w: Wallet) => w.userId === userId && w.isActive);
    
    for (const userWallet of userWallets) {
      if (userWallet.isPrimary && userWallet.id !== wallet.id) {
        await this.dataAdapter.update('wallets', userWallet.id, { isPrimary: false });
      }
    }

    // Set this wallet as primary
    const updatedWallet = await this.dataAdapter.update('wallets', wallet.id, { isPrimary: true });

    console.log(`Primary wallet changed to ${normalizedAddress} for user ${userId}`);

    return updatedWallet;
  }

  async getUserWallets(userId: string): Promise<Wallet[]> {
    return this.dataAdapter.findWhere('wallets', (w: Wallet) => w.userId === userId && w.isActive);
  }

  async getPrimaryWallet(userId: string): Promise<Wallet | null> {
    return this.dataAdapter.findOne('wallets', (w: Wallet) => w.userId === userId && w.isPrimary && w.isActive);
  }
}