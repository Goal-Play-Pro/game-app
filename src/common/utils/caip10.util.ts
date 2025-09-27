import { getAddress } from 'ethers';

const CAIP10_PREFIX = 'caip10';
const CHAIN_NAMESPACE = 'eip155';

export const formatCaip10 = (chainId: number, address: string): string => {
  if (!Number.isInteger(chainId) || chainId < 0) {
    throw new Error('Invalid chain id for CAIP-10');
  }
  const checksum = getAddress(address);
  return `${CAIP10_PREFIX}:${CHAIN_NAMESPACE}:${chainId}:${checksum}`;
};

export const parseCaip10 = (identifier: string): { chainId: number; address: string } => {
  const match = /^caip10:eip155:(\d+):(0x[0-9a-fA-F]{40})$/.exec(identifier);
  if (!match) {
    throw new Error('Invalid CAIP-10 identifier');
  }
  return {
    chainId: Number.parseInt(match[1], 10),
    address: getAddress(match[2]),
  };
};

export const ensureCaip10 = (chainId: number, addressOrIdentifier: string): string => {
  if (addressOrIdentifier.startsWith('caip10:')) {
    return addressOrIdentifier;
  }
  return formatCaip10(chainId, addressOrIdentifier);
};
