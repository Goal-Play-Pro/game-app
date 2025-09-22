import { ethers } from 'ethers';

/**
 * Payment Service - Manejo de pagos reales con MetaMask
 * Integra con contratos USDT en BSC para pagos reales
 */
export class PaymentService {
  // USDT Contract en BSC Mainnet
  private static readonly USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
  private static readonly BSC_CHAIN_ID = 56;
  
  // ABI mínimo para USDT (solo transfer)
  private static readonly USDT_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
  ];

  /**
   * Verificar si MetaMask está instalado
   */
  static isMetaMaskInstalled(): boolean {
    return typeof window !== 'undefined' && !!(window as any).ethereum;
  }

  /**
   * Conectar a MetaMask y cambiar a BSC
   */
  static async connectAndSwitchToBSC(): Promise<{
    success: boolean;
    address?: string;
    error?: string;
  }> {
    try {
      const ethereum = (window as any).ethereum;
      if (!ethereum) {
        return { success: false, error: 'MetaMask not installed' };
      }

      // Solicitar conexión
      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        return { success: false, error: 'No accounts found' };
      }

      // Verificar/cambiar a BSC
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      
      if (parseInt(chainId, 16) !== this.BSC_CHAIN_ID) {
        await this.switchToBSC();
      }

      return { success: true, address: accounts[0] };
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to connect to MetaMask' 
      };
    }
  }

  /**
   * Cambiar a BSC network
   */
  static async switchToBSC(): Promise<void> {
    const ethereum = (window as any).ethereum;
    
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BSC Mainnet
      });
    } catch (switchError: any) {
      // Si BSC no está añadido, añadirlo
      if (switchError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x38',
            chainName: 'BNB Smart Chain',
            nativeCurrency: {
              name: 'BNB',
              symbol: 'BNB',
              decimals: 18,
            },
            rpcUrls: ['https://bsc-dataseed1.binance.org/'],
            blockExplorerUrls: ['https://bscscan.com/'],
          }],
        });
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Obtener balance USDT del usuario
   */
  static async getUSDTBalance(userAddress: string): Promise<{
    balance: string;
    formatted: string;
    error?: string;
  }> {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(this.USDT_CONTRACT, this.USDT_ABI, provider);
      
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      const formatted = ethers.formatUnits(balance, decimals);
      
      return {
        balance: balance.toString(),
        formatted: parseFloat(formatted).toFixed(2),
      };
    } catch (error: any) {
      console.error('Error getting USDT balance:', error);
      return {
        balance: '0',
        formatted: '0.00',
        error: error.message,
      };
    }
  }

  /**
   * Ejecutar pago USDT real
   */
  static async executeUSDTPayment(
    toAddress: string,
    amount: string,
    userAddress: string
  ): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
    needsApproval?: boolean;
  }> {
    try {
      console.log(`💰 Iniciando pago USDT: ${amount} USDT a ${toAddress}`);
      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(this.USDT_CONTRACT, this.USDT_ABI, signer);
      
      // Convertir amount a wei (USDT tiene 18 decimales)
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Verificar balance
      const balance = await contract.balanceOf(userAddress);
      if (balance < amountWei) {
        return {
          success: false,
          error: `Insufficient USDT balance. Required: ${amount} USDT, Available: ${ethers.formatUnits(balance, 18)} USDT`
        };
      }

      console.log(`✅ Balance verificado: ${ethers.formatUnits(balance, 18)} USDT`);

      // Ejecutar transferencia
      console.log(`🚀 Ejecutando transferencia de ${amount} USDT...`);
      const tx = await contract.transfer(toAddress, amountWei);
      
      console.log(`📝 Transacción enviada: ${tx.hash}`);
      console.log(`⏳ Esperando confirmación...`);
      
      // Esperar confirmación
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log(`✅ Pago confirmado: ${tx.hash}`);
        return {
          success: true,
          transactionHash: tx.hash,
        };
      } else {
        console.error(`❌ Transacción falló: ${tx.hash}`);
        return {
          success: false,
          error: 'Transaction failed on blockchain',
        };
      }
    } catch (error: any) {
      console.error('❌ Error ejecutando pago USDT:', error);
      
      // Manejar errores específicos
      if (error.code === 'ACTION_REJECTED') {
        return {
          success: false,
          error: 'Payment cancelled by user',
        };
      }
      
      if (error.message?.includes('insufficient funds')) {
        return {
          success: false,
          error: 'Insufficient BNB for gas fees',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Payment failed',
      };
    }
  }

  /**
   * Estimar gas para transacción USDT
   */
  static async estimateUSDTGas(
    toAddress: string,
    amount: string,
    userAddress: string
  ): Promise<{
    gasLimit: string;
    gasPrice: string;
    gasCostBNB: string;
    gasCostUSD: string;
    error?: string;
  }> {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const contract = new ethers.Contract(this.USDT_CONTRACT, this.USDT_ABI, provider);
      
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Estimar gas
      const gasLimit = await contract.transfer.estimateGas(toAddress, amountWei);
      const gasPrice = await provider.getFeeData();
      
      // Calcular costo en BNB
      const gasCostWei = gasLimit * (gasPrice.gasPrice || 0n);
      const gasCostBNB = ethers.formatEther(gasCostWei);
      
      // Obtener precio BNB (mock - en producción usar API real)
      const bnbPriceUSD = 300; // Aproximado
      const gasCostUSD = (parseFloat(gasCostBNB) * bnbPriceUSD).toFixed(2);
      
      return {
        gasLimit: gasLimit.toString(),
        gasPrice: gasPrice.gasPrice?.toString() || '0',
        gasCostBNB: parseFloat(gasCostBNB).toFixed(6),
        gasCostUSD,
      };
    } catch (error: any) {
      console.error('Error estimating gas:', error);
      return {
        gasLimit: '65000',
        gasPrice: '5000000000',
        gasCostBNB: '0.001',
        gasCostUSD: '0.30',
        error: error.message,
      };
    }
  }

  /**
   * Verificar si una transacción fue exitosa
   */
  static async verifyTransaction(txHash: string): Promise<{
    success: boolean;
    confirmations: number;
    blockNumber?: number;
    gasUsed?: string;
    error?: string;
  }> {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      
      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        return { success: false, confirmations: 0, error: 'Transaction not found' };
      }

      const receipt = await provider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { success: false, confirmations: 0, error: 'Transaction pending' };
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        success: receipt.status === 1,
        confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error: any) {
      console.error('Error verifying transaction:', error);
      return {
        success: false,
        confirmations: 0,
        error: error.message,
      };
    }
  }

  /**
   * Obtener información de la red BSC
   */
  static async getBSCNetworkInfo(): Promise<{
    chainId: number;
    blockNumber: number;
    gasPrice: string;
    isConnected: boolean;
  }> {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      
      const [network, blockNumber, feeData] = await Promise.all([
        provider.getNetwork(),
        provider.getBlockNumber(),
        provider.getFeeData(),
      ]);

      return {
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: feeData.gasPrice?.toString() || '0',
        isConnected: Number(network.chainId) === this.BSC_CHAIN_ID,
      };
    } catch (error) {
      console.error('Error getting BSC network info:', error);
      return {
        chainId: 0,
        blockNumber: 0,
        gasPrice: '0',
        isConnected: false,
      };
    }
  }
}