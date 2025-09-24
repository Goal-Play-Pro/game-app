import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../database/entities/order.entity';
import { ProductVariant } from '../../database/entities/product-variant.entity';
import { User } from '../../database/entities/user.entity';
import { CreateOrderDto } from './dto/order.dto';
import { getReceivingWallet } from '../../config/backend.config';
import { GachaService } from '../gacha/gacha.service';
import { ReferralService } from '../referral/referral.service';
import { BlockchainService } from '../../services/blockchain.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  private readonly REQUIRED_CONFIRMATIONS = 12;

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private gachaService: GachaService,
    private referralService: ReferralService,
    private blockchainService: BlockchainService,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify product variant exists
    const variant = await this.variantRepository.findOne({
      where: { id: dto.productVariantId, isActive: true },
      relations: ['product']
    });
    
    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    // Calculate total price
    const unitPrice = parseFloat(variant.priceUSDT);
    const totalPrice = unitPrice * dto.quantity;

    // Validate quantity limits
    if (variant.maxPurchasesPerUser) {
      const existingOrders = await this.orderRepository.count({
        where: { 
          userId, 
          productVariantId: dto.productVariantId, 
          status: 'fulfilled' 
        }
      });
      
      if (existingOrders >= variant.maxPurchasesPerUser) {
        throw new BadRequestException('Maximum purchases per user exceeded');
      }
    }

    // Create order
    const order = await this.orderRepository.save({
      userId,
      productVariantId: dto.productVariantId,
      quantity: dto.quantity,
      unitPriceUSDT: unitPrice.toFixed(2),
      totalPriceUSDT: totalPrice.toFixed(2),
      status: 'pending',
      paymentWallet: dto.paymentWallet,
      receivingWallet: getReceivingWallet(dto.chainType),
      chainType: dto.chainType,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      productVariant: variant,
    });

    this.logger.log(`📦 Order created: ${order.id} for $${totalPrice.toFixed(2)} USDT`);

    // Start payment monitoring
    this.schedulePaymentCheck(order.id, 60000);

    return order;
  }

  private schedulePaymentCheck(orderId: string, delay: number = 60000) {
    setTimeout(async () => {
      try {
        await this.checkOrderPayment(orderId);
      } catch (error) {
        this.logger.error(`Error checking payment for order ${orderId}:`, error);
      }
    }, delay);
  }

  private async checkOrderPayment(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['productVariant']
    });
    
    if (!order || !['pending', 'pending_confirmations'].includes(order.status)) {
      return;
    }

    this.logger.log(`🔍 Verificando pago real para orden ${orderId}`);
    
    try {
      await this.verifyAndUpdateOrder(order);
    } catch (error) {
      this.logger.error(`❌ Error verificando pago para orden ${orderId}:`, error);
    } finally {
      const updated = await this.orderRepository.findOne({ where: { id: orderId } });
      if (updated && ['pending', 'pending_confirmations'].includes(updated.status)) {
        this.schedulePaymentCheck(orderId, 60000);
      }
    }
  }

  private async getCurrentBlockNumber(): Promise<number> {
    try {
      const web3 = new (require('web3'))('https://bsc-dataseed1.binance.org/');
      return await web3.eth.getBlockNumber();
    } catch (error) {
      this.logger.error('Error obteniendo número de bloque actual:', error);
      return 0;
    }
  }

  private compareAmounts(txValue: string, expectedUSDT: string): boolean {
    try {
      const BigNumber = require('bignumber.js');
      const txAmount = new BigNumber(txValue).dividedBy(new BigNumber(10).pow(18));
      const expectedAmount = new BigNumber(expectedUSDT);
      
      // Permitir diferencia de hasta 0.01 USDT
      return txAmount.minus(expectedAmount).abs().isLessThanOrEqualTo(0.01);
    } catch (error) {
      return false;
    }
  }

  private async getConfirmations(blockNumber: string | number): Promise<number> {
    try {
      const currentBlock = await this.getCurrentBlockNumber();
      return currentBlock - Number(blockNumber);
    } catch (error) {
      return 0;
    }
  }

  async getUserOrders(userId: string) {
    return this.orderRepository.find({
      where: { userId },
      relations: ['productVariant', 'productVariant.product'],
      order: { createdAt: 'DESC' }
    });
  }

  async getOrderById(id: string, userId: string) {
    const order = await this.orderRepository.findOne({
      where: { id, userId },
      relations: ['productVariant', 'productVariant.product']
    });
    
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    
    return order;
  }

  async getPaymentStatus(orderId: string, userId: string) {
    const order = await this.getOrderById(orderId, userId);
    
    return {
      status: order.status,
      transactionHash: order.transactionHash,
      confirmations: order.confirmations || 0,
      requiredConfirmations: this.REQUIRED_CONFIRMATIONS,
      estimatedConfirmationTime: order.status === 'fulfilled' || order.status === 'paid' ? 'Confirmed' : '5-10 minutes',
    };
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.getOrderById(orderId, userId);
    
    if (order.status !== 'pending') {
      throw new BadRequestException('Order cannot be cancelled');
    }

    await this.orderRepository.update(orderId, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });

    return { message: 'Order cancelled successfully' };
  }

  async processPaymentNotification(orderId: string, transactionHash: string, userId: string) {
    const order = await this.getOrderById(orderId, userId);
    
    if (!['pending', 'pending_confirmations'].includes(order.status)) {
      throw new BadRequestException('Order is not pending payment');
    }

    this.logger.log(`💳 Payment notification received for order ${orderId}: ${transactionHash}`);

    // Verificar la transacción en blockchain
    const verification = await this.blockchainService.verifyUSDTTransaction(
      transactionHash,
      order.paymentWallet,
      order.receivingWallet,
      order.totalPriceUSDT
    );

    if (!verification.isValid) {
      this.logger.error(`❌ Payment verification failed for order ${orderId}: ${verification.error}`);
      throw new BadRequestException(`Payment verification failed: ${verification.error}`);
    }

    this.logger.log(`✅ Payment verified for order ${orderId}`);

    const confirmations = verification.transaction
      ? await this.getConfirmations(verification.transaction.blockNumber)
      : 0;

    const updatePayload: Partial<Order> = {
      transactionHash,
      blockNumber: verification.transaction?.blockNumber,
      confirmations,
      paidAt: order.paidAt ?? new Date(),
    };

    if (confirmations >= this.REQUIRED_CONFIRMATIONS) {
      await this.orderRepository.update(orderId, {
        ...updatePayload,
        status: 'paid',
      });

      await this.fulfillOrder(orderId);

      return {
        success: true,
        status: 'fulfilled',
        confirmations: this.REQUIRED_CONFIRMATIONS,
        requiredConfirmations: this.REQUIRED_CONFIRMATIONS,
        transactionHash,
      };
    }

    await this.orderRepository.update(orderId, {
      ...updatePayload,
      status: 'pending_confirmations',
    });

    this.schedulePaymentCheck(orderId, 60000);

    return {
      success: true,
      status: 'pending_confirmations',
      confirmations,
      requiredConfirmations: this.REQUIRED_CONFIRMATIONS,
      transactionHash,
    };
  }

  async fulfillOrder(orderId: string) {
    try {
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['productVariant']
      });
      
      if (!order) return;

      this.logger.log(`🎁 Fulfilling order ${orderId}`);

      // Execute gacha draw
      const drawResult = await this.gachaService.executeGachaDraw(order);
      
      // Add players to inventory
      for (const player of drawResult.players) {
        await this.gachaService.addPlayerToInventory(
          order.userId, 
          player, 
          orderId, 
          drawResult.drawId
        );
      }

      // Process referral commission
      await this.referralService.processReferralCommission(orderId);

      // Mark order as fulfilled
      await this.orderRepository.update(orderId, {
        status: 'fulfilled',
        fulfilledAt: new Date(),
      });

      this.logger.log(`🎉 Order ${orderId} fulfilled with ${drawResult.players.length} players`);

    } catch (error) {
      this.logger.error(`❌ Error fulfilling order ${orderId}:`, error);
      
      // Mark order as failed
      await this.orderRepository.update(orderId, {
        status: 'cancelled',
        cancelledAt: new Date(),
      });
    }
  }

  private async verifyAndUpdateOrder(order: Order) {
    let verificationResult: { isValid: boolean; transaction?: any; receipt?: any; transferEvent?: any; error?: string } | null = null;
    let transactionHash = order.transactionHash;

    if (!transactionHash) {
      const recentTxs = await this.blockchainService.getUSDTTransactionsForAddress(
        order.receivingWallet,
        await this.getCurrentBlockNumber() - 1000
      );

      const matchingTx = recentTxs.find(tx =>
        tx.from.toLowerCase() === order.paymentWallet.toLowerCase() &&
        tx.to.toLowerCase() === order.receivingWallet.toLowerCase() &&
        this.compareAmounts(tx.value, order.totalPriceUSDT)
      );

      if (!matchingTx) {
        this.logger.log(`⏳ No se encontró pago para orden ${order.id}`);
        return;
      }

      transactionHash = matchingTx.hash;
      verificationResult = await this.blockchainService.verifyUSDTTransaction(
        transactionHash,
        order.paymentWallet,
        order.receivingWallet,
        order.totalPriceUSDT
      );

      if (!verificationResult.isValid) {
        this.logger.warn(`❌ Verificación fallida para orden ${order.id}: ${verificationResult.error}`);
        return;
      }

      await this.orderRepository.update(order.id, {
        transactionHash,
        blockNumber: matchingTx.blockNumber ? parseInt(matchingTx.blockNumber) : undefined,
        paidAt: new Date(parseInt(matchingTx.timeStamp) * 1000),
      });
    } else {
      verificationResult = await this.blockchainService.verifyUSDTTransaction(
        transactionHash,
        order.paymentWallet,
        order.receivingWallet,
        order.totalPriceUSDT
      );

      if (!verificationResult.isValid) {
        this.logger.warn(`❌ Verificación fallida para orden ${order.id}: ${verificationResult.error}`);
        return;
      }
    }

    const confirmations = verificationResult.transaction
      ? await this.getConfirmations(verificationResult.transaction.blockNumber)
      : 0;

    const updatePayload: Partial<Order> = {
      confirmations,
      transactionHash,
      blockNumber: verificationResult.transaction?.blockNumber ?? order.blockNumber,
      paidAt: order.paidAt ?? new Date(),
    };

    if (confirmations >= this.REQUIRED_CONFIRMATIONS) {
      this.logger.log(`✅ Pago verificado para orden ${order.id}`);

      await this.orderRepository.update(order.id, {
        ...updatePayload,
        status: 'paid',
      });

      await this.fulfillOrder(order.id);
    } else {
      this.logger.log(`⏳ Orden ${order.id} esperando confirmaciones: ${confirmations}/${this.REQUIRED_CONFIRMATIONS}`);

      await this.orderRepository.update(order.id, {
        ...updatePayload,
        status: 'pending_confirmations',
      });
    }
  }
}
