export type WalletType = 'metamask' | 'safepal' | 'unknown';

export interface Eip1193RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | Record<string, unknown>;
}

export interface Eip1193Provider {
  request: (args: Eip1193RequestArguments) => Promise<unknown>;
  isMetaMask?: boolean;
  isSafePal?: boolean;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  isConnected?: () => boolean;
}

export interface Eip1193DisconnectEvent {
  code?: number;
  message?: string;
  data?: unknown;
}

export interface Eip6963ProviderInfo {
  rdns: string;
  name: string;
  icon?: string;
  description?: string;
  uuid?: string;
}

export interface Eip6963AnnounceProviderEvent extends Event {
  readonly detail?: {
    provider: Eip1193Provider;
    info?: Eip6963ProviderInfo;
  };
}

export interface WalletWindow extends Window {
  ethereum?: Eip1193Provider;
  safePal?: Eip1193Provider;
}
