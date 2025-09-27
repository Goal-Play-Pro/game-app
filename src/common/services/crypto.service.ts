import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PublicKey } from '@solana/web3.js';
import { verify as verifyEd25519 } from '@noble/ed25519';
import { ethers } from 'ethers';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CryptoService {
  private readonly providersByChainId = new Map<number, ethers.JsonRpcProvider>();
  private readonly erc1271Interface = new ethers.Interface([
    'function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)'
  ]);

  constructor(private readonly configService: ConfigService) {
    this.initializeProviders();
  }

  /**
   * Verificar firma SIWE (Sign-In with Ethereum)
   */
  async verifySiweSignature(
    message: string,
    signature: string,
    address: string,
    chainId?: number,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        return true;
      }
    } catch (error) {
      // continue with ERC-1271 fallback
    }

    return this.verifyErc1271Signature(message, signature, address, chainId);
  }

  private async verifyErc1271Signature(
    message: string,
    signature: string,
    address: string,
    chainId?: number,
  ): Promise<boolean> {
    if (!chainId) {
      return false;
    }

    const provider = this.providersByChainId.get(chainId);
    if (!provider) {
      return false;
    }

    try {
      const code = await provider.getCode(address);
      if (!code || code === '0x') {
        return false;
      }

      const hash = ethers.hashMessage(message);
      const callData = this.erc1271Interface.encodeFunctionData('isValidSignature', [hash, signature]);
      const result = await provider.call({ to: address, data: callData });
      if (!result || result === '0x') {
        return false;
      }

      const [magicValue] = this.erc1271Interface.decodeFunctionResult('isValidSignature', result);
      return magicValue === '0x1626ba7e';
    } catch (error) {
      return false;
    }
  }

  private initializeProviders() {
    const configs: Array<{ chainId: number; envKeys: string[]; fallback?: string; name: string }> = [
      {
        chainId: 1,
        envKeys: ['ETH_RPC_URL', 'MAINNET_RPC_URL'],
        fallback: 'https://cloudflare-eth.com',
        name: 'ethereum',
      },
      {
        chainId: 56,
        envKeys: ['BSC_RPC_URL'],
        fallback: 'https://bsc-dataseed1.binance.org/',
        name: 'bsc',
      },
      {
        chainId: 137,
        envKeys: ['POLYGON_RPC_URL'],
        fallback: 'https://polygon-rpc.com',
        name: 'polygon',
      },
      {
        chainId: 42161,
        envKeys: ['ARB_RPC_URL', 'ARBITRUM_RPC_URL'],
        fallback: 'https://arb1.arbitrum.io/rpc',
        name: 'arbitrum',
      },
    ];

    for (const config of configs) {
      if (this.providersByChainId.has(config.chainId)) {
        continue;
      }

      const url = this.resolveRpcUrl(config.envKeys, config.fallback);
      if (!url) {
        continue;
      }

      try {
        const provider = new ethers.JsonRpcProvider(url, {
          chainId: config.chainId,
          name: config.name,
        });
        this.providersByChainId.set(config.chainId, provider);
      } catch (error) {
        // Ignore provider initialization errors and continue with other chains
      }
    }
  }

  private resolveRpcUrl(envKeys: string[], fallback?: string): string | undefined {
    for (const key of envKeys) {
      const value = this.configService.get<string>(key);
      if (value && value.trim().length > 0) {
        return value;
      }
    }
    return fallback;
  }

  /**
   * Verificar firma de Solana
   */
  async verifySolanaSignature(
    message: string,
    signature: string,
    publicKey: string,
  ): Promise<boolean> {
    try {
      const key = new PublicKey(publicKey);
      const signatureBytes = Uint8Array.from(Buffer.from(signature, 'base64'));
      if (signatureBytes.length !== 64) {
        return false;
      }

      const messageBytes = new TextEncoder().encode(message);
      return await verifyEd25519(signatureBytes, messageBytes, key.toBytes());
    } catch (error) {
      return false;
    }
  }

  /**
   * Generar challenge único para autenticación
   */
  generateChallenge(): string {
    return `Login to Football Game Platform at ${new Date().toISOString()}. Nonce: ${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Hash de contraseña (para futuras implementaciones)
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  /**
   * Verificar contraseña hasheada
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validar dirección de Ethereum
   */
  isValidEthereumAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  /**
   * Validar dirección de Solana
   */
  isValidSolanaAddress(address: string): boolean {
    try {
      // Basic Solana address validation
      return address.length === 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
    } catch {
      return false;
    }
  }
}
