import { Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CryptoService {
  /**
   * Verificar firma SIWE (Sign-In with Ethereum)
   */
  async verifySiweSignature(
    message: string,
    signature: string,
    address: string,
  ): Promise<boolean> {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      return false;
    }
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
      // Simplified Solana verification for now
      // In production, implement proper ed25519 signature verification
      return publicKey.length === 44 && signature.length > 0;
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