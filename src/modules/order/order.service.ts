import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataAdapterService } from '../../common/services/data-adapter.service';
import { ShopService } from '../shop/shop.service';
import { LedgerService } from '../ledger/ledger.service';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/order.dto';
import { OrderStatus, ChainType } from '../../common/types/base.types';

@Injectable()
export class OrderService {
  private readonly receivingWallets: Record<ChainType, string[]>;

  constructor(
    private shopService: ShopService,
    private dataAdapter: DataAdapterService,
    private configService: ConfigService,
    private ledgerService: LedgerService,
  ) {
    // Configure receiving wallets for each chain
    this.receivingWallets = {
      [ChainType.ETHEREUM]: [
        this.configService.get<string>('ETH_RECEIVING_WALLET_1') || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
      ],
      [ChainType.POLYGON]: [
        this.configService.get<string>('POLYGON_RECEIVING_WALLET_1') || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
      ],
      [ChainType.BSC]: [
        this.configService.get<string>('BSC_RECEIVING_WALLET_1') || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
      ],
      [ChainType.ARBITRUM]: [
        this.configService.get<string>('ARB_RECEIVING_WALLET_1') || '0x742d35Cc6635C0532925a3b8D34C83dD3e0Be000',
      ],
      [ChainType.SOLANA]: [
        this.configService.get<string>('SOL_RECEIVING_WALLET_1') || '11111111111111111111111111111112',
      ],
    };
  }

  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    // Validate product variant
    const variant = await this.shopService.findVariantById(dto.productVariantId);
    
    // Calculate pricing
    const unitPrice = parseFloat(variant.priceUSDT);
    const totalPrice = unitPrice * dto.quantity;

    // Select receiving wallet
    const wallets = this.receivingWallets[dto.chainType];
    const receivingWallet = wallets[0];

    // Create order with 30-minute expiration
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const order = await this.dataAdapter.create('orders', {
      userId,
      productVariantId: dto.productVariantId,
      quantity: dto.quantity,
      unitPriceUSDT: unitPrice.toString(),
      totalPriceUSDT: totalPrice.toString(),
      status: OrderStatus.PENDING,
      paymentWallet: dto.paymentWallet.toLowerCase(),
      receivingWallet,
      chainType: dto.chainType,
      expiresAt,
    });

    console.log(`Order created: ${order.id} for user ${userId}`);

    // Process referral commission if applicable
    await this.processReferralCommission(order);

    return order;
  }

  private async processReferralCommission(order: Order): Promise<void> {
    try {
      // Check if user was referred and process commission
      const referralRegistration = await this.dataAdapter.findOne('referral-registrations', 
        (reg: any) => reg.referredUserId === order.userId && reg.isActive
      );

      if (referralRegistration) {
        const commissionAmount = (parseFloat(order.totalPriceUSDT) * 0.05).toFixed(2); // 5%
        
        // Create commission record
        await this.dataAdapter.create('referral-commissions', {
          referrerUserId: referralRegistration.referrerUserId,
          referrerWallet: referralRegistration.referrerWallet,
          referredUserId: order.userId,
          referredWallet: referralRegistration.referredWallet,
          orderId: order.id,
          orderAmount: order.totalPriceUSDT,
          commissionAmount,
          commissionPercentage: 5,
          status: 'paid',
          paidAt: new Date().toISOString(),
        });

        // Record in ledger
        await this.ledgerService.createDoubleEntry(
          referralRegistration.referrerUserId,
          'platform_revenue',
          'user_wallet',
          commissionAmount,
          'USDT',
          `Referral commission from order ${order.id}`,
          'referral' as any,
          order.id,
        );

        console.log(`Referral commission processed: ${commissionAmount} USDT for user ${referralRegistration.referrerUserId}`);
      }
    } catch (error) {
      console.error('Error processing referral commission:', error);
      // Don't fail the order if referral processing fails
    }
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return this.dataAdapter.findWhere('orders', (o: Order) => o.userId === userId);
  }

  async findOrderById(id: string): Promise<Order> {
    const order = await this.dataAdapter.findById<Order>('orders', id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async cancelOrder(userId: string, orderId: string): Promise<Order> {
    const order = await this.findOrderById(orderId);
    
    if (order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order cannot be cancelled in current status');
    }

    const updatedOrder = await this.dataAdapter.update('orders', orderId, {
      status: OrderStatus.CANCELLED,
      cancelledAt: new Date().toISOString(),
    });

    console.log(`Order cancelled: ${orderId} by user ${userId}`);

    return updatedOrder;
  }
}