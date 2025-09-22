import { Injectable, Logger } from '@nestjs/common';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils';
import BigNumber from 'bignumber.js';

/**
 * Blockchain Service - Verificación real de transacciones USDT en BSC
 * Integra con BSCScan API para verificar pagos
 */
@Injectable()
export class BlockchainService {
  private readonly logger = new Logger(BlockchainService.name);
  private web3: Web3;
  
  // USDT Contract en BSC
  private readonly USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
  private readonly BSC_RPC = 'https://bsc-dataseed1.binance.org/';
  private readonly BSCSCAN_API = 'https://api.bscscan.com/api';
  
  // ABI mínimo para USDT (solo Transfer event)
  private readonly USDT_ABI: AbiItem[] = [
    {
      anonymous: false,
      inputs: [
        { indexed: true, name: 'from', type: 'address' },
        { indexed: true, name: 'to', type: 'address' },
        { indexed: false, name: 'value', type: 'uint256' }
      ],
      name: 'Transfer',
      type: 'event'
    },
    {
      constant: true,
      inputs: [],
      name: 'decimals',
      outputs: [{ name: '', type: 'uint8' }],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    }
  ];

  constructor() {
    this.web3 = new Web3(this.BSC_RPC);
    this.logger.log('🔗 Blockchain service initialized for BSC');
  }

  /**
   * Verificar transacción USDT específica
   */
  async verifyUSDTTransaction(
    txHash: string,
    expectedFromAddress: string,
    expectedToAddress: string,
    expectedAmount: string
  ): Promise<{
    isValid: boolean;
    transaction?: any;
    receipt?: any;
    transferEvent?: any;
    error?: string;
  }> {
    try {
      this.logger.log(`🔍 Verificando transacción USDT: ${txHash}`);
      
      // 1. Obtener transacción
      const transaction = await this.web3.eth.getTransaction(txHash);
      if (!transaction) {
        return { isValid: false, error: 'Transaction not found' };
      }

      // 2. Verificar que es al contrato USDT
      if (transaction.to?.toLowerCase() !== this.USDT_CONTRACT.toLowerCase()) {
        return { isValid: false, error: 'Transaction is not to USDT contract' };
      }

      // 3. Obtener receipt para verificar éxito
      const receipt = await this.web3.eth.getTransactionReceipt(txHash);
      if (!receipt || !receipt.status) {
        return { isValid: false, error: 'Transaction failed or pending' };
      }

      // 4. Decodificar logs para encontrar Transfer event
      const contract = new this.web3.eth.Contract(this.USDT_ABI, this.USDT_CONTRACT);
      
      // Decodificar eventos Transfer manualmente
      const transferEvents = receipt.logs
        .filter(log => log.address.toLowerCase() === this.USDT_CONTRACT.toLowerCase())
        .map(log => {
          try {
            // Decodificar Transfer event manualmente
            const transferSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            if (log.topics[0] === transferSignature) {
              return {
                returnValues: {
                  from: '0x' + log.topics[1].slice(26),
                  to: '0x' + log.topics[2].slice(26),
                  value: this.web3.utils.hexToNumberString(log.data)
                }
              };
            }
            return null;
          } catch {
            return null;
          }
        })
        .filter(event => event !== null);

      if (transferEvents.length === 0) {
        return { isValid: false, error: 'No USDT transfer found in transaction' };
      }

      // 5. Verificar el transfer específico
      const transferEvent = transferEvents.find(event => 
        event.returnValues.from.toLowerCase() === expectedFromAddress.toLowerCase() &&
        event.returnValues.to.toLowerCase() === expectedToAddress.toLowerCase()
      );

      if (!transferEvent) {
        return { 
          isValid: false, 
          error: `Transfer not found from ${expectedFromAddress} to ${expectedToAddress}` 
        };
      }

      // 6. Verificar cantidad (USDT tiene 18 decimales)
      const transferAmount = new BigNumber(transferEvent.returnValues.value);
      const expectedAmountWei = new BigNumber(expectedAmount).multipliedBy(new BigNumber(10).pow(18));
      
      if (!transferAmount.isEqualTo(expectedAmountWei)) {
        return { 
          isValid: false, 
          error: `Amount mismatch. Expected: ${expectedAmount} USDT, Got: ${transferAmount.dividedBy(new BigNumber(10).pow(18)).toString()} USDT` 
        };
      }

      // 7. Verificar confirmaciones (mínimo 12)
      const currentBlock = await this.web3.eth.getBlockNumber();
      const confirmations = Number(currentBlock) - Number(transaction.blockNumber);
      
      if (confirmations < 12) {
        return { 
          isValid: false, 
          error: `Insufficient confirmations. Current: ${confirmations}, Required: 12` 
        };
      }

      this.logger.log(`✅ Transacción USDT verificada exitosamente: ${txHash}`);
      
      return {
        isValid: true,
        transaction,
        receipt,
        transferEvent,
      };

    } catch (error) {
      this.logger.error(`❌ Error verificando transacción ${txHash}:`, error);
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Verificar múltiples transacciones para una dirección
   */
  async getUSDTTransactionsForAddress(
    address: string,
    startBlock?: number,
    endBlock?: number
  ): Promise<any[]> {
    try {
      const apiKey = process.env.BSCSCAN_API_KEY || 'YourApiKeyToken';
      const url = `${this.BSCSCAN_API}?module=account&action=tokentx&contractaddress=${this.USDT_CONTRACT}&address=${address}&startblock=${startBlock || 0}&endblock=${endBlock || 'latest'}&sort=desc&apikey=${apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json() as { status: string; result: any[]; message?: string };
      
      if (data.status === '1') {
        return data.result;
      } else {
        this.logger.warn(`⚠️ BSCScan API error: ${data.message}`);
        return [];
      }
    } catch (error) {
      this.logger.error('❌ Error fetching transactions from BSCScan:', error);
      return [];
    }
  }

  /**
   * Monitorear pagos pendientes en tiempo real
   */
  async monitorPendingPayments(orders: any[]): Promise<void> {
    this.logger.log(`🔍 Monitoreando ${orders.length} órdenes pendientes...`);
    
    for (const order of orders) {
      try {
        // Buscar transacciones recientes a la wallet de recepción
        const recentTxs = await this.getUSDTTransactionsForAddress(
          order.receivingWallet,
          Number(await this.getCurrentBlockNumber()) - 1000 // Últimos ~1000 bloques
        );

        // Buscar transacción que coincida con la orden
        const matchingTx = recentTxs.find(tx => 
          tx.from.toLowerCase() === order.paymentWallet.toLowerCase() &&
          tx.to.toLowerCase() === order.receivingWallet.toLowerCase() &&
          new BigNumber(tx.value).dividedBy(new BigNumber(10).pow(18)).isEqualTo(new BigNumber(order.totalPriceUSDT))
        );

        if (matchingTx) {
          this.logger.log(`💰 Pago encontrado para orden ${order.id}: ${matchingTx.hash}`);
          
          // Verificar la transacción completamente
          const verification = await this.verifyUSDTTransaction(
            matchingTx.hash,
            order.paymentWallet,
            order.receivingWallet,
            order.totalPriceUSDT
          );

          if (verification.isValid) {
            // Aquí se actualizaría la orden en la base de datos
            this.logger.log(`✅ Pago verificado para orden ${order.id}`);
          }
        }
      } catch (error) {
        this.logger.error(`❌ Error monitoreando orden ${order.id}:`, error);
      }
    }
  }

  /**
   * Obtener balance USDT de una dirección
   */
  async getUSDTBalance(address: string): Promise<string> {
    try {
      const contract = new this.web3.eth.Contract(this.USDT_ABI, this.USDT_CONTRACT);
      const balance = await contract.methods.balanceOf(address).call() as string;
      return new BigNumber(balance).dividedBy(new BigNumber(10).pow(18)).toString();
    } catch (error) {
      this.logger.error(`❌ Error obteniendo balance USDT para ${address}:`, error);
      return '0';
    }
  }

  /**
   * Validar dirección BSC
   */
  isValidBSCAddress(address: string): boolean {
    return this.web3.utils.isAddress(address);
  }

  /**
   * Obtener precio actual de BNB en USD
   */
  async getBNBPrice(): Promise<number> {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
      const data = await response.json() as { binancecoin?: { usd: number } };
      return data.binancecoin?.usd || 0;
    } catch (error) {
      this.logger.error('❌ Error obteniendo precio de BNB:', error);
      return 0;
    }
  }

  /**
   * Obtener información de gas para transacciones
   */
  async getGasInfo(): Promise<{
    gasPrice: string;
    gasPriceGwei: string;
    estimatedCostUSD: string;
  }> {
    try {
      const gasPrice = await this.web3.eth.getGasPrice();
      const gasPriceGwei = this.web3.utils.fromWei(gasPrice, 'gwei');
      const bnbPrice = await this.getBNBPrice();
      
      // Estimar costo para transfer USDT (≈65,000 gas)
      const estimatedGas = 65000;
      const costBNB = new BigNumber(gasPrice).multipliedBy(estimatedGas).dividedBy(new BigNumber(10).pow(18));
      const costUSD = costBNB.multipliedBy(bnbPrice);

      return {
        gasPrice: gasPrice.toString(),
        gasPriceGwei,
        estimatedCostUSD: costUSD.toFixed(2),
      };
    } catch (error) {
      this.logger.error('❌ Error obteniendo información de gas:', error);
      return {
        gasPrice: '0',
        gasPriceGwei: '0',
        estimatedCostUSD: '0',
      };
    }
  }

  /**
   * Verificar si una transacción está confirmada
   */
  async isTransactionConfirmed(txHash: string, requiredConfirmations: number = 12): Promise<{
    isConfirmed: boolean;
    confirmations: number;
    blockNumber?: number;
  }> {
    try {
      const transaction = await this.web3.eth.getTransaction(txHash);
      if (!transaction || !transaction.blockNumber) {
        return { isConfirmed: false, confirmations: 0 };
      }

      const currentBlock = await this.web3.eth.getBlockNumber();
      const confirmations = Number(currentBlock) - Number(transaction.blockNumber);

      return {
        isConfirmed: confirmations >= requiredConfirmations,
        confirmations,
        blockNumber: Number(transaction.blockNumber),
      };
    } catch (error) {
      this.logger.error(`❌ Error verificando confirmaciones para ${txHash}:`, error);
      return { isConfirmed: false, confirmations: 0 };
    }
  }

  /**
   * Obtener historial de transacciones USDT para análisis
   */
  async getTransactionHistory(
    address: string,
    days: number = 30
  ): Promise<{
    totalReceived: string;
    totalSent: string;
    transactionCount: number;
    averageAmount: string;
    transactions: any[];
  }> {
    try {
      const transactions = await this.getUSDTTransactionsForAddress(address);
      
      // Filtrar por fecha
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const recentTxs = transactions.filter(tx => 
        parseInt(tx.timeStamp) * 1000 > cutoffTime
      );

      let totalReceived = new BigNumber(0);
      let totalSent = new BigNumber(0);

      recentTxs.forEach(tx => {
        const amount = new BigNumber(tx.value).dividedBy(new BigNumber(10).pow(18));
        if (tx.to.toLowerCase() === address.toLowerCase()) {
          totalReceived = totalReceived.plus(amount);
        } else {
          totalSent = totalSent.plus(amount);
        }
      });

      const averageAmount = recentTxs.length > 0 
        ? totalReceived.plus(totalSent).dividedBy(recentTxs.length)
        : new BigNumber(0);

      return {
        totalReceived: totalReceived.toString(),
        totalSent: totalSent.toString(),
        transactionCount: recentTxs.length,
        averageAmount: averageAmount.toString(),
        transactions: recentTxs.slice(0, 50), // Últimas 50 transacciones
      };
    } catch (error) {
      this.logger.error(`❌ Error obteniendo historial para ${address}:`, error);
      return {
        totalReceived: '0',
        totalSent: '0',
        transactionCount: 0,
        averageAmount: '0',
        transactions: [],
      };
    }
  }

  /**
   * Generar reporte de ingresos para el negocio
   */
  async generateRevenueReport(receivingWallets: string[], days: number = 30): Promise<{
    totalRevenue: string;
    transactionCount: number;
    averageOrderValue: string;
    topPayingAddresses: Array<{ address: string; amount: string; count: number }>;
    dailyBreakdown: Array<{ date: string; revenue: string; count: number }>;
  }> {
    try {
      this.logger.log(`📊 Generando reporte de ingresos para ${days} días...`);
      
      let totalRevenue = new BigNumber(0);
      let allTransactions: any[] = [];

      // Obtener transacciones de todas las wallets de recepción
      for (const wallet of receivingWallets) {
        const history = await this.getTransactionHistory(wallet, days);
        totalRevenue = totalRevenue.plus(history.totalReceived);
        allTransactions = allTransactions.concat(
          history.transactions.map(tx => ({ ...tx, receivingWallet: wallet }))
        );
      }

      // Análisis de direcciones que más pagan
      const payerStats = new Map<string, { amount: BigNumber; count: number }>();
      
      allTransactions.forEach(tx => {
        const from = tx.from.toLowerCase();
        const amount = new BigNumber(tx.value).dividedBy(new BigNumber(10).pow(18));
        
        if (payerStats.has(from)) {
          const current = payerStats.get(from)!;
          payerStats.set(from, {
            amount: current.amount.plus(amount),
            count: current.count + 1
          });
        } else {
          payerStats.set(from, { amount, count: 1 });
        }
      });

      const topPayingAddresses = Array.from(payerStats.entries())
        .sort((a, b) => b[1].amount.comparedTo(a[1].amount))
        .slice(0, 10)
        .map(([address, stats]) => ({
          address,
          amount: stats.amount.toString(),
          count: stats.count
        }));

      // Breakdown diario
      const dailyStats = new Map<string, { revenue: BigNumber; count: number }>();
      
      allTransactions.forEach(tx => {
        const date = new Date(parseInt(tx.timeStamp) * 1000).toISOString().split('T')[0];
        const amount = new BigNumber(tx.value).dividedBy(new BigNumber(10).pow(18));
        
        if (dailyStats.has(date)) {
          const current = dailyStats.get(date)!;
          dailyStats.set(date, {
            revenue: current.revenue.plus(amount),
            count: current.count + 1
          });
        } else {
          dailyStats.set(date, { revenue: amount, count: 1 });
        }
      });

      const dailyBreakdown = Array.from(dailyStats.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([date, stats]) => ({
          date,
          revenue: stats.revenue.toString(),
          count: stats.count
        }));

      const averageOrderValue = allTransactions.length > 0 
        ? totalRevenue.dividedBy(allTransactions.length).toString()
        : '0';

      this.logger.log(`📈 Reporte generado: $${totalRevenue.toString()} USDT en ${allTransactions.length} transacciones`);

      return {
        totalRevenue: totalRevenue.toString(),
        transactionCount: allTransactions.length,
        averageOrderValue,
        topPayingAddresses,
        dailyBreakdown,
      };
    } catch (error) {
      this.logger.error('❌ Error generando reporte de ingresos:', error);
      return {
        totalRevenue: '0',
        transactionCount: 0,
        averageOrderValue: '0',
        topPayingAddresses: [],
        dailyBreakdown: [],
      };
    }
  }

  /**
   * Obtener número de bloque actual de BSC
   */
  private async getCurrentBlockNumber(): Promise<number> {
    try {
      const blockNumber = await this.web3.eth.getBlockNumber();
      return Number(blockNumber);
    } catch (error) {
      this.logger.error('❌ Error obteniendo número de bloque actual:', error);
      return 0;
    }
  }

  /**
   * Detectar transacciones sospechosas
   */
  async detectSuspiciousActivity(address: string): Promise<{
    isSuspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    try {
      const history = await this.getTransactionHistory(address, 7); // Últimos 7 días
      const reasons: string[] = [];
      let riskScore = 0;

      // 1. Verificar volumen inusual
      const totalVolume = new BigNumber(history.totalSent).plus(history.totalReceived);
      if (totalVolume.isGreaterThan(100000)) { // >$100K en 7 días
        reasons.push('High volume activity');
        riskScore += 30;
      }

      // 2. Verificar frecuencia de transacciones
      if (history.transactionCount > 100) { // >100 tx en 7 días
        reasons.push('High frequency transactions');
        riskScore += 20;
      }

      // 3. Verificar patrones de round numbers
      const roundAmounts = history.transactions.filter(tx => {
        const amount = new BigNumber(tx.value).dividedBy(new BigNumber(10).pow(18));
        return amount.modulo(1).isEqualTo(0); // Números redondos
      });

      if (roundAmounts.length / history.transactions.length > 0.8) {
        reasons.push('Suspicious round number pattern');
        riskScore += 25;
      }

      // 4. Verificar si es una dirección nueva
      const firstTx = history.transactions[history.transactions.length - 1];
      if (firstTx && parseInt(firstTx.timeStamp) * 1000 > Date.now() - (24 * 60 * 60 * 1000)) {
        reasons.push('Very new address');
        riskScore += 15;
      }

      return {
        isSuspicious: riskScore > 50,
        reasons,
        riskScore,
      };
    } catch (error) {
      this.logger.error(`❌ Error detectando actividad sospechosa para ${address}:`, error);
      return {
        isSuspicious: false,
        reasons: ['Error analyzing address'],
        riskScore: 0,
      };
    }
  }

  /**
   * Obtener estadísticas de red BSC
   */
  async getBSCNetworkStats(): Promise<{
    currentBlock: number;
    gasPrice: string;
    bnbPrice: number;
    usdtPrice: number;
    networkCongestion: 'low' | 'medium' | 'high';
  }> {
    try {
      const [currentBlock, gasPrice, bnbPrice] = await Promise.all([
        this.web3.eth.getBlockNumber(),
        this.web3.eth.getGasPrice(),
        this.getBNBPrice(),
      ]);

      // Obtener precio USDT
      const usdtResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=usd');
      const usdtData = await usdtResponse.json() as { tether?: { usd: number } };
      const usdtPrice = usdtData.tether?.usd || 1;

      // Determinar congestión basada en gas price
      const gasPriceGwei = parseFloat(this.web3.utils.fromWei(gasPrice, 'gwei'));
      let networkCongestion: 'low' | 'medium' | 'high' = 'low';
      
      if (gasPriceGwei > 20) networkCongestion = 'high';
      else if (gasPriceGwei > 10) networkCongestion = 'medium';

      return {
        currentBlock: Number(currentBlock),
        gasPrice: this.web3.utils.fromWei(gasPrice, 'gwei'),
        bnbPrice,
        usdtPrice,
        networkCongestion,
      };
    } catch (error) {
      this.logger.error('❌ Error obteniendo estadísticas de red BSC:', error);
      return {
        currentBlock: 0,
        gasPrice: '0',
        bnbPrice: 0,
        usdtPrice: 1,
        networkCongestion: 'low',
      };
    }
  }
}