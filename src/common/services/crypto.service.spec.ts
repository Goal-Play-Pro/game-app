import { ConfigService } from '@nestjs/config';
import { PublicKey } from '@solana/web3.js';
import { getPublicKey, sign, utils as edUtils } from '@noble/ed25519';
import { ethers } from 'ethers';
import { CryptoService } from './crypto.service';

const createConfig = (rpcUrl?: string): ConfigService => {
  return {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'ETH_RPC_URL') {
        return rpcUrl;
      }
      return undefined;
    })
  } as unknown as ConfigService;
};

describe('CryptoService.verifySiweSignature', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns true for a valid EOA signature', async () => {
    const wallet = ethers.Wallet.createRandom();
    const message = 'Test SIWE message';
    const signature = await wallet.signMessage(message);

    const service = new CryptoService(createConfig());

    await expect(
      service.verifySiweSignature(message, signature, wallet.address),
    ).resolves.toBe(true);
  });

  it('returns false when signature is invalid and provider unavailable', async () => {
    const wallet = ethers.Wallet.createRandom();
    const message = 'Test SIWE message';
    const otherWallet = ethers.Wallet.createRandom();
    const signature = await wallet.signMessage(message);

    const service = new CryptoService(createConfig());

    await expect(
      service.verifySiweSignature(message, signature, otherWallet.address),
    ).resolves.toBe(false);
  });

  it('falls back to ERC-1271 and returns true when contract validates signature', async () => {
    const message = 'Contract wallet message';
    const signature = '0xdeadbeef';
    const contractAddress = '0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa';

    const service = new CryptoService(createConfig());

    const iface = new ethers.Interface([
      'function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4)'
    ]);
    const hash = ethers.hashMessage(message);
    const encodedCall = iface.encodeFunctionData('isValidSignature', [hash, signature]);
    const encodedReturn = iface.encodeFunctionResult('isValidSignature', ['0x1626ba7e']);

    const providerMock = {
      getCode: jest.fn().mockResolvedValue('0x1234'),
      call: jest.fn().mockImplementation(async ({ to, data }: { to: string; data: string; }) => {
        expect(to).toBe(contractAddress);
        expect(data).toBe(encodedCall);
        return encodedReturn;
      }),
    } as unknown as ethers.JsonRpcProvider;

    (service as any).ethereumProvider = providerMock;

    await expect(
      service.verifySiweSignature(message, signature, contractAddress),
    ).resolves.toBe(true);
  });

  it('returns false when ERC-1271 contract rejects signature', async () => {
    const message = 'Rejected message';
    const signature = '0x1234';
    const contractAddress = '0xBbBBBBBbBBBBBbBBBBBbBBBBBbBBBBBbBBbBBBbB';

    const service = new CryptoService(createConfig());

    const providerMock = {
      getCode: jest.fn().mockResolvedValue('0x1234'),
      call: jest.fn().mockResolvedValue('0x00000000'),
    } as unknown as ethers.JsonRpcProvider;

    (service as any).ethereumProvider = providerMock;

    await expect(
      service.verifySiweSignature(message, signature, contractAddress),
    ).resolves.toBe(false);
  });
});

describe('CryptoService.verifySolanaSignature', () => {
  it('returns true for a valid Solana signature (base64)', async () => {
    const privateKey = edUtils.randomPrivateKey();
    const publicKeyBytes = await getPublicKey(privateKey);
    const message = 'Solana authentication message';
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await sign(messageBytes, privateKey);
    const signature = Buffer.from(signatureBytes).toString('base64');
    const service = new CryptoService(createConfig());

    await expect(
      service.verifySolanaSignature(message, signature, new PublicKey(publicKeyBytes).toBase58()),
    ).resolves.toBe(true);
  });

  it('returns false for invalid Solana signature', async () => {
    const privateKey = edUtils.randomPrivateKey();
    const otherPrivateKey = edUtils.randomPrivateKey();
    const publicKeyBytes = await getPublicKey(otherPrivateKey);
    const message = 'Invalid Solana signature';
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await sign(messageBytes, privateKey);
    const signature = Buffer.from(signatureBytes).toString('base64');
    const service = new CryptoService(createConfig());

    await expect(
      service.verifySolanaSignature(message, signature, new PublicKey(publicKeyBytes).toBase58()),
    ).resolves.toBe(false);
  });
});
