import type { Eip1193Provider, Eip6963ProviderInfo } from '../types/wallet';

type ProviderRecord = {
  provider: Eip1193Provider;
  info?: Eip6963ProviderInfo;
};

let preferredProvider: ProviderRecord | null = null;

export const setPreferredProvider = (provider: Eip1193Provider, info?: Eip6963ProviderInfo) => {
  preferredProvider = { provider, info };
};

export const getPreferredProvider = (): Eip1193Provider | null => {
  return preferredProvider?.provider ?? null;
};

export const getPreferredProviderInfo = (): Eip6963ProviderInfo | undefined => {
  return preferredProvider?.info;
};

export const clearPreferredProvider = () => {
  preferredProvider = null;
};
