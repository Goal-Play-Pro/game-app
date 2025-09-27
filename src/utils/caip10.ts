import { ethers } from 'ethers';

const CAIP10_PREFIX = 'caip10';
const CHAIN_NAMESPACE = 'eip155';

export interface Caip10Account {
  prefix: string;
  namespace: string;
  chainId: number;
  address: string;
}

const CAIP10_PATTERN = /^caip10:([a-z0-9-]+):(\d+):(0x[0-9a-fA-F]{40})$/;

export const formatCaip10 = (chainId: number, address: string): string => {
  if (!Number.isInteger(chainId) || chainId < 0) {
    throw new Error('Invalid chain id for CAIP-10');
  }

  const checksumAddress = ethers.getAddress(address);
  return `${CAIP10_PREFIX}:${CHAIN_NAMESPACE}:${chainId}:${checksumAddress}`;
};

export const parseCaip10 = (identifier: string): Caip10Account => {
  const match = CAIP10_PATTERN.exec(identifier);
  if (!match) {
    throw new Error('Invalid CAIP-10 identifier');
  }

  const [, namespace, chainIdStr, address] = match;
  return {
    prefix: CAIP10_PREFIX,
    namespace,
    chainId: Number.parseInt(chainIdStr, 10),
    address: ethers.getAddress(address),
  };
};

export const isCaip10 = (value: unknown): value is string => {
  return typeof value === 'string' && CAIP10_PATTERN.test(value);
};

export const normalizeToCaip10 = (chainId: number, addressOrIdentifier: string): string => {
  return isCaip10(addressOrIdentifier) ? addressOrIdentifier : formatCaip10(chainId, addressOrIdentifier);
};
