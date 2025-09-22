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
    this.startPaymentMonitoring(order.id);

    return order;
  }

  private async startPaymentMonitoring(orderId: string) {
    // Mock payment verification - replace with real blockchain monitoring
    setTimeout(async () => {
      try {
        await this.checkOrderPayment(orderId);
      } catch (error) {
        this.logger.error(`Error checking payment for order ${orderId}:`, error);
      }
    }, 60000); // Check after 1 minute
  }

  private async checkOrderPayment(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['productVariant']
    });
    
    if (!order || order.status !== 'pending') {
      return;
    }

    this.logger.log(`🔍 Verificando pago real para orden ${orderId}`);
    
    try {
      // Buscar transacciones USDT recientes a la wallet de recepción
      const recentTxs = await this.blockchainService.getUSDTTransactionsForAddress(
        order.receivingWallet,
        await this.getCurrentBlockNumber() - 1000 // Últimos ~1000 bloques
      );

      // Buscar transacción que coincida con la orden
      const matchingTx = recentTxs.find(tx => 
        tx.from.toLowerCase() === order.paymentWallet.toLowerCase() &&
        tx.to.toLowerCase() === order.receivingWallet.toLowerCase() &&
        this.compareAmounts(tx.value, order.totalPriceUSDT)
      );

      if (matchingTx) {
        this.logger.log(`💰 Transacción encontrada para orden ${orderId}: ${matchingTx.hash}`);
        
        // Verificar la transacción completamente
        const verification = await this.blockchainService.verifyUSDTTransaction(
          matchingTx.hash,
          order.paymentWallet,
          order.receivingWallet,
          order.totalPriceUSDT
        );

        if (verification.isValid) {
          this.logger.log(`✅ Pago verificado para orden ${orderId}`);
          
          // Verificar actividad sospechosa
          const suspiciousCheck = await this.blockchainService.detectSuspiciousActivity(order.paymentWallet);
          if (suspiciousCheck.isSuspicious) {
            this.logger.warn(`⚠️ Actividad sospechosa detectada para ${order.paymentWallet}: ${suspiciousCheck.reasons.join(', ')}`);
          }
      
          // Actualizar orden con datos reales
          await this.orderRepository.update(orderId, {
            status: 'paid',
            transactionHash: matchingTx.hash,
            blockNumber: parseInt(matchingTx.blockNumber),
            confirmations: verification.transaction ? 
              await this.getConfirmations(verification.transaction.blockNumber) : 12,
            paidAt: new Date(parseInt(matchingTx.timeStamp) * 1000),
          });

          // Procesar fulfillment
          await this.fulfillOrder(orderId);
        } else {
          this.logger.warn(`❌ Verificación fallida para orden ${orderId}: ${verification.error}`);
        }
      } else {
        this.logger.log(`⏳ No se encontró pago para orden ${orderId}`);
      }
    } catch (error) {
      this.logger.error(`❌ Error verificando pago para orden ${orderId}:`, error);
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
      requiredConfirmations: 12,
      estimatedConfirmationTime: order.status === 'paid' ? 'Confirmed' : '5-10 minutes',
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
    
    if (order.status !== 'pending') {
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

    // Actualizar orden con datos de la transacción
    await this.orderRepository.update(orderId, {
      status: 'paid',
      transactionHash,
      blockNumber: verification.transaction?.blockNumber,
      confirmations: verification.transaction ? 
        await this.getConfirmations(verification.transaction.blockNumber) : 12,
      paidAt: new Date(),
    });

    // Procesar fulfillment inmediatamente
    await this.fulfillOrder(orderId);

    return {
      success: true,
      message: 'Payment verified and order fulfilled',
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
}