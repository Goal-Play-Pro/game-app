import { ethers } from 'ethers';
import { PAYMENT_CONFIG } from '../config/payment.config';
import type { WalletType, Eip1193Provider, WalletWindow, Eip6963ProviderInfo, Eip1193RequestArguments } from '../types/wallet';
import { getPreferredProvider, getPreferredProviderInfo } from '../utils/providerRegistry';
import {
  createWalletError,
  normalizeWalletError,
  resolveMethodFallback,
  WalletRpcError,
} from '../utils/walletErrors';

const normalizeInfoString = (info?: Eip6963ProviderInfo) => {
  if (!info) {
    return '';
  }
  return `${info.rdns ?? ''} ${info.name ?? ''} ${info.description ?? ''}`.toLowerCase();
};

const isSafePalProvider = (provider?: Eip1193Provider | null, info?: Eip6963ProviderInfo) => {
  if (provider?.isSafePal) {
    return true;
  }
  return normalizeInfoString(info).includes('safepal');
};

const isMetaMaskProvider = (provider?: Eip1193Provider | null, info?: Eip6963ProviderInfo) => {
  if (provider?.isMetaMask) {
    return true;
  }
  return normalizeInfoString(info).includes('metamask');
};

/**
 * Payment Service - Manejo de pagos reales con wallets compatibles
 * Integra con contratos USDT en BSC para pagos reales
 */
export class PaymentService {
  private static resolveWindowProvider(): Eip1193Provider | null {
    const preferred = getPreferredProvider();
    if (preferred) {
      return preferred;
    }

    if (typeof window === 'undefined') {
      return null;
    }
    const win = window as unknown as WalletWindow;
    if (win.safePal?.request) {
      return win.safePal;
    }
    if (win.ethereum) {
      return win.ethereum;
    }
    return null;
  }

  private static async requestProvider<T = unknown>(
    provider: Eip1193Provider,
    args: Eip1193RequestArguments,
  ): Promise<T> {
    const fallback = resolveMethodFallback(args.method);

    try {
      return (await provider.request(args)) as T;
    } catch (error: unknown) {
      throw normalizeWalletError(error, fallback.code, fallback.message);
    }
  }

  private static detectWalletType(provider?: Eip1193Provider | null): WalletType {
    const candidate = provider ?? this.resolveWindowProvider();
    const win = typeof window !== 'undefined' ? (window as unknown as WalletWindow) : undefined;

    const info = getPreferredProviderInfo();
    const preferred = getPreferredProvider();

    if (info && (!candidate || !preferred || candidate === preferred)) {
      if (isSafePalProvider(candidate, info)) {
        return 'safepal';
      }
      if (isMetaMaskProvider(candidate, info)) {
        return 'metamask';
      }
    }

    if (isSafePalProvider(candidate, info) || win?.safePal?.isSafePal) {
      return 'safepal';
    }

    if (isMetaMaskProvider(candidate, info) || win?.ethereum?.isMetaMask) {
      return 'metamask';
    }

    if (candidate || win?.ethereum || win?.safePal) {
      return 'metamask';
    }

    return 'unknown';
  }

  private static getWalletProvider(): Eip1193Provider | null {
    return this.resolveWindowProvider();
  }

  // USDT Contract en BSC Mainnet
  private static readonly USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
  private static readonly BSC_CHAIN_ID = 56;
  private static readonly PAYMENT_GATEWAY_CONTRACT = PAYMENT_CONFIG.PAYMENT_GATEWAY_CONTRACT;
  
  // ABI mínimo para USDT (solo transfer)
  private static readonly USDT_ABI = [
    'function transfer(address to, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
  ];

  private static readonly PAYMENT_GATEWAY_ABI = [
    'function payOrder(bytes32 orderId, address token, address merchant, uint256 amount) external'
  ];

  /**
   * Verificar si existe un provider compatible
   */
  static isMetaMaskInstalled(): boolean {
    return this.getWalletProvider() !== null;
  }

  /**
   * Asegura que la wallet esté conectada a BSC.
   * Solo se invoca durante acciones sensibles (pagos) que el usuario inicia explícitamente,
   * evitando cambios automáticos de red en el flujo de conexión.
   */
  static async ensureBscNetwork(): Promise<{
    success: boolean;
    chainId?: number;
    error?: string;
    errorCode?: number;
  }> {
    const provider = this.getWalletProvider();

    if (!provider) {
      return { success: false, error: 'Wallet provider not detected', errorCode: 4900 };
    }

    try {
      const currentChainIdHex = await this.requestProvider<string>(provider, {
        method: 'eth_chainId',
        params: [],
      });
      const currentChainId = parseInt(currentChainIdHex, 16);

      if (currentChainId === this.BSC_CHAIN_ID) {
        return { success: true, chainId: currentChainId };
      }

      await this.switchToBSC(provider);
      return { success: true, chainId: this.BSC_CHAIN_ID };
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        4901,
        'Failed to switch to BNB Smart Chain.',
      );
      console.error('Error ensuring BSC network:', normalizedError);
      return {
        success: false,
        error: normalizedError.message || 'Failed to switch to BSC network',
        errorCode: normalizedError.code,
      };
    }
  }

  /**
   * Cambiar a BSC network
   */
  static async switchToBSC(providerArg?: Eip1193Provider): Promise<void> {
    const provider = providerArg ?? this.getWalletProvider();
    if (!provider) {
      throw new Error('Wallet provider not available');
    }

    try {
      await this.requestProvider(provider, {
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }],
      });
    } catch (switchError: unknown) {
      const normalizedSwitchError = normalizeWalletError(
        switchError,
        4901,
        'Unable to switch to BNB Smart Chain.',
      );

      if (normalizedSwitchError.code === 4902) {
        try {
          await this.requestProvider(provider, {
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x38',
                chainName: 'BNB Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18,
                },
                rpcUrls: ['https://bsc-dataseed1.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/'],
              },
            ],
          });

          await this.requestProvider(provider, {
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
          });
          return;
        } catch (addError: unknown) {
          const normalizedAddError = normalizeWalletError(
            addError,
            4901,
            'Failed to add BNB Smart Chain to wallet.',
          );

          throw normalizedAddError;
        }
      }

      throw normalizedSwitchError;
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
      const provider = this.getWalletProvider();
      if (!provider) {
        return {
          balance: '0',
          formatted: '0.00',
          error: 'Wallet provider not available',
        };
      }

      const browserProvider = new ethers.BrowserProvider(provider);
      const contract = new ethers.Contract(this.USDT_CONTRACT, this.USDT_ABI, browserProvider);
      
      const balance = await contract.balanceOf(userAddress);
      const decimals = await contract.decimals();
      const formatted = ethers.formatUnits(balance, decimals);
      
      return {
        balance: balance.toString(),
        formatted: parseFloat(formatted).toFixed(2),
      };
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        -1,
        'Failed to retrieve USDT balance.',
      );
      console.error('Error getting USDT balance:', normalizedError);
      return {
        balance: '0',
        formatted: '0.00',
        error: normalizedError.message,
      };
    }
  }

  /**
   * Ejecutar pago USDT usando contrato de gateway seguro
   */
  static async processOrderPayment(
    orderId: string,
    merchantWallet: string,
    amount: string
  ): Promise<{
    success: boolean;
    paymentHash?: string;
    approvalHash?: string;
    error?: string;
    errorCode?: number;
  }> {
    const provider = this.getWalletProvider();

    if (!provider) {
      return { success: false, error: 'Wallet provider not detected', errorCode: 4900 };
    }

    if (!this.PAYMENT_GATEWAY_CONTRACT) {
      return { success: false, error: 'Payment gateway contract not configured' };
    }

    try {
      const accounts = await this.requestProvider<string[]>(provider, {
        method: 'eth_accounts',
        params: [],
      });
      const activeAccount = accounts?.[0];

      if (!activeAccount) {
        return { success: false, error: 'Please connect your wallet before paying' };
      }

      const ensureNetwork = await this.ensureBscNetwork();
      if (!ensureNetwork.success) {
        return {
          success: false,
          error: ensureNetwork.error || 'Failed to switch to BSC',
          errorCode: ensureNetwork.errorCode,
        };
      }

      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const usdtContract = new ethers.Contract(this.USDT_CONTRACT, this.USDT_ABI, signer);
      const gatewayContract = new ethers.Contract(this.PAYMENT_GATEWAY_CONTRACT, this.PAYMENT_GATEWAY_ABI, signer);
      const normalizedMerchant = ethers.getAddress(merchantWallet);

      const amountWei = ethers.parseUnits(amount, 18);
      const balance: bigint = await usdtContract.balanceOf(activeAccount);

      if (balance < amountWei) {
        return {
          success: false,
          error: `Insufficient USDT balance. Required: ${amount} USDT, Available: ${ethers.formatUnits(balance, 18)} USDT`,
        };
      }

      const allowance: bigint = await usdtContract.allowance(activeAccount, this.PAYMENT_GATEWAY_CONTRACT);

      let approvalHash: string | undefined;
      if (allowance < amountWei) {
        console.log('📝 Soliciting allowance approval for payment gateway...');
        const approvalTx = await usdtContract.approve(this.PAYMENT_GATEWAY_CONTRACT, amountWei);
        approvalHash = approvalTx.hash;
        await approvalTx.wait();
        console.log('✅ Approval confirmed:', approvalHash);
      }

      const orderHash = ethers.id(orderId);
      console.log('🚀 Executing gateway payment', { orderId, orderHash, merchantWallet: normalizedMerchant, amount });
      const paymentTx = await gatewayContract.payOrder(orderHash, this.USDT_CONTRACT, normalizedMerchant, amountWei);
      const receipt = await paymentTx.wait();

      if (!receipt?.status) {
        return { success: false, error: 'Payment transaction failed on-chain' };
      }

      return {
        success: true,
        paymentHash: paymentTx.hash,
        approvalHash,
      };
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(error, 4001, 'Payment failed.');
      console.error('❌ Error executing gateway payment:', normalizedError);
      if (normalizedError.code === 4001) {
        return { success: false, error: 'Payment cancelled by user', errorCode: normalizedError.code };
      }
      return {
        success: false,
        error: normalizedError.message || 'Payment failed',
        errorCode: normalizedError.code,
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
      const provider = this.getWalletProvider();
      if (!provider) {
        return {
          gasLimit: '65000',
          gasPrice: '5000000000',
          gasCostBNB: '0.001',
          gasCostUSD: '0.30',
          error: 'Wallet provider not available',
        };
      }

      const browserProvider = new ethers.BrowserProvider(provider);
      const contract = new ethers.Contract(this.USDT_CONTRACT, this.USDT_ABI, browserProvider);
      
      const amountWei = ethers.parseUnits(amount, 18);
      
      // Estimar gas
      const gasLimit = await contract.transfer.estimateGas(toAddress, amountWei);
      const gasPrice = await browserProvider.getFeeData();
      
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
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        -1,
        'Failed to estimate gas costs.',
      );
      console.error('Error estimating gas:', normalizedError);
      return {
        gasLimit: '65000',
        gasPrice: '5000000000',
        gasCostBNB: '0.001',
        gasCostUSD: '0.30',
        error: normalizedError.message,
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
      const provider = this.getWalletProvider();
      if (!provider) {
        return {
          success: false,
          confirmations: 0,
          error: 'Wallet provider not available',
        };
      }

      const browserProvider = new ethers.BrowserProvider(provider);
      
      const tx = await browserProvider.getTransaction(txHash);
      if (!tx) {
        return { success: false, confirmations: 0, error: 'Transaction not found' };
      }

      const receipt = await browserProvider.getTransactionReceipt(txHash);
      if (!receipt) {
        return { success: false, confirmations: 0, error: 'Transaction pending' };
      }

      const currentBlock = await browserProvider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        success: receipt.status === 1,
        confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        -1,
        'Failed to verify transaction.',
      );
      console.error('Error verifying transaction:', normalizedError);
      return {
        success: false,
        confirmations: 0,
        error: normalizedError.message,
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
      const provider = this.getWalletProvider();
      if (!provider) {
        return {
          chainId: 0,
          blockNumber: 0,
          gasPrice: '0',
          isConnected: false,
        };
      }

      const browserProvider = new ethers.BrowserProvider(provider);
      
      const [network, blockNumber, feeData] = await Promise.all([
        browserProvider.getNetwork(),
        browserProvider.getBlockNumber(),
        browserProvider.getFeeData(),
      ]);

      return {
        chainId: Number(network.chainId),
        blockNumber,
        gasPrice: feeData.gasPrice?.toString() || '0',
        isConnected: Number(network.chainId) === this.BSC_CHAIN_ID,
      };
    } catch (error: unknown) {
      const normalizedError = normalizeWalletError(
        error,
        -1,
        'Failed to retrieve BSC network info.',
      );
      console.error('Error getting BSC network info:', normalizedError);
      return {
        chainId: 0,
        blockNumber: 0,
        gasPrice: '0',
        isConnected: false,
      };
    }
  }
}
