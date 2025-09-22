import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../database/entities/order.entity';
import { BlockchainService } from './blockchain.service';
import { OrderService } from '../modules/order/order.service';

/**
 * Payment Monitor Service - Monitoreo automático de pagos blockchain
 * Ejecuta verificaciones periódicas de órdenes pendientes
 */
@Injectable()
export class PaymentMonitorService {
  private readonly logger = new Logger(PaymentMonitorService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private blockchainService: BlockchainService,
    private orderService: OrderService,
  ) {}

  /**
   * Monitoreo cada 2 minutos de órdenes pendientes
   */
  @Cron('0 */2 * * * *') // Cada 2 minutos
  async monitorPendingPayments() {
    try {
      this.logger.log('🔍 Iniciando monitoreo de pagos pendientes...');
      
      // Obtener órdenes pendientes (últimas 2 horas)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const pendingOrders = await this.orderRepository.find({
        where: {
          status: 'pending',
          createdAt: twoHoursAgo,
        },
        relations: ['productVariant'],
      });

      if (pendingOrders.length === 0) {
        this.logger.log('✅ No hay órdenes pendientes para verificar');
        return;
      }

      this.logger.log(`📋 Verificando ${pendingOrders.length} órdenes pendientes...`);

      // Procesar cada orden
      for (const order of pendingOrders) {
        await this.verifyOrderPayment(order);
        
        // Pequeña pausa entre verificaciones para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      this.logger.log('✅ Monitoreo de pagos completado');
    } catch (error) {
      this.logger.error('❌ Error en monitoreo de pagos:', error);
    }
  }

  /**
   * Verificar pago de una orden específica
   */
  private async verifyOrderPayment(order: Order) {
    try {
      this.logger.log(`🔍 Verificando orden ${order.id}...`);
      
      // Buscar transacciones USDT recientes
      const recentTxs = await this.blockchainService.getUSDTTransactionsForAddress(
        order.receivingWallet,
        await this.getCurrentBlockNumber() - 1000
      );

      // Buscar transacción que coincida
      const matchingTx = recentTxs.find(tx => 
        tx.from.toLowerCase() === order.paymentWallet.toLowerCase() &&
        tx.to.toLowerCase() === order.receivingWallet.toLowerCase() &&
        this.compareUSDTAmounts(tx.value, order.totalPriceUSDT) &&
        parseInt(tx.timeStamp) * 1000 >= new Date(order.createdAt).getTime()
      );

      if (matchingTx) {
        this.logger.log(`💰 Pago encontrado para orden ${order.id}: ${matchingTx.hash}`);
        
        // Verificación completa de la transacción
        const verification = await this.blockchainService.verifyUSDTTransaction(
          matchingTx.hash,
          order.paymentWallet,
          order.receivingWallet,
          order.totalPriceUSDT
        );

        if (verification.isValid) {
          await this.processSuccessfulPayment(order, matchingTx, verification);
        } else {
          this.logger.warn(`❌ Verificación fallida para orden ${order.id}: ${verification.error}`);
        }
      } else {
        // Verificar si la orden ha expirado
        if (new Date() > new Date(order.expiresAt)) {
          await this.expireOrder(order);
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error verificando orden ${order.id}:`, error);
    }
  }

  /**
   * Procesar pago exitoso
   */
  private async processSuccessfulPayment(order: Order, transaction: any, verification: any) {
    try {
      // Verificar actividad sospechosa
      const suspiciousCheck = await this.blockchainService.detectSuspiciousActivity(order.paymentWallet);
      
      if (suspiciousCheck.isSuspicious && suspiciousCheck.riskScore > 70) {
        this.logger.warn(`🚨 ALTA SOSPECHA para orden ${order.id}: ${suspiciousCheck.reasons.join(', ')}`);
        
        // Marcar orden para revisión manual
        await this.orderRepository.update(order.id, {
          status: 'under_review',
          metadata: JSON.stringify({
            suspiciousActivity: suspiciousCheck,
            requiresManualReview: true,
          }),
        });
        return;
      }

      // Obtener confirmaciones actuales
      const confirmationCheck = await this.blockchainService.isTransactionConfirmed(transaction.hash);
      
      // Actualizar orden con datos reales
      await this.orderRepository.update(order.id, {
        status: 'paid',
        transactionHash: transaction.hash,
        blockNumber: parseInt(transaction.blockNumber),
        confirmations: confirmationCheck.confirmations,
        paidAt: new Date(parseInt(transaction.timeStamp) * 1000),
        metadata: JSON.stringify({
          verificationTimestamp: new Date().toISOString(),
          gasUsed: verification.receipt?.gasUsed,
          gasPrice: verification.transaction?.gasPrice,
          suspiciousCheck: suspiciousCheck.riskScore > 30 ? suspiciousCheck : null,
        }),
      });

      this.logger.log(`✅ Orden ${order.id} marcada como pagada - TX: ${transaction.hash}`);

      // Procesar fulfillment automático
      // Llamar al método público de OrderService
      const orderService = new (require('../modules/order/order.service')).OrderService(
        this.orderRepository,
        null, // variantRepository no necesario para fulfillment
        null, // userRepository no necesario para fulfillment
        null, // gachaService se inyectará
        null, // referralService se inyectará
        this.blockchainService
      );
      await orderService.fulfillOrder(order.id);
      
    } catch (error) {
      this.logger.error(`❌ Error procesando pago exitoso para orden ${order.id}:`, error);
    }
  }

  /**
   * Expirar orden que no recibió pago
   */
  private async expireOrder(order: Order) {
    try {
      await this.orderRepository.update(order.id, {
        status: 'expired',
        cancelledAt: new Date(),
      });
      
      this.logger.log(`⏰ Orden ${order.id} expirada - No se recibió pago`);
    } catch (error) {
      this.logger.error(`❌ Error expirando orden ${order.id}:`, error);
    }
  }

  /**
   * Comparar cantidades USDT con tolerancia
   */
  private compareUSDTAmounts(txValue: string, expectedUSDT: string): boolean {
    try {
      const BigNumber = require('bignumber.js');
      const txAmount = new BigNumber(txValue).dividedBy(new BigNumber(10).pow(18));
      const expectedAmount = new BigNumber(expectedUSDT);
      
      // Tolerancia de 0.01 USDT
      return txAmount.minus(expectedAmount).abs().isLessThanOrEqualTo(0.01);
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener número de bloque actual
   */
  private async getCurrentBlockNumber(): Promise<number> {
    try {
      const Web3 = require('web3');
      const web3 = new Web3('https://bsc-dataseed1.binance.org/');
      return await web3.eth.getBlockNumber();
    } catch (error) {
      this.logger.error('Error obteniendo bloque actual:', error);
      return 0;
    }
  }

  /**
   * Reporte de monitoreo para administradores
   */
  async getMonitoringReport(): Promise<{
    pendingOrders: number;
    expiredOrders: number;
    suspiciousTransactions: number;
    totalVerified: number;
    lastCheck: string;
  }> {
    try {
      const [pending, expired, total] = await Promise.all([
        this.orderRepository.count({ where: { status: 'pending' } }),
        this.orderRepository.count({ where: { status: 'expired' } }),
        this.orderRepository.count({ where: { status: 'paid' } }),
      ]);

      // Contar transacciones sospechosas (últimas 24 horas)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentOrders = await this.orderRepository.find({
        where: {
          status: 'under_review',
          createdAt: dayAgo,
        },
      });

      return {
        pendingOrders: pending,
        expiredOrders: expired,
        suspiciousTransactions: recentOrders.length,
        totalVerified: total,
        lastCheck: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error generando reporte de monitoreo:', error);
      return {
        pendingOrders: 0,
        expiredOrders: 0,
        suspiciousTransactions: 0,
        totalVerified: 0,
        lastCheck: new Date().toISOString(),
      };
    }
  }
}