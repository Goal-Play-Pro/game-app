export type WalletType = 'metamask' | 'safepal' | 'unknown';

export interface Eip1193RequestArguments {
  readonly method: string;
  readonly params?: readonly unknown[] | Record<string, unknown>;
}

export type Eip1193EventHandler = (...args: unknown[]) => void;

export type JestMockedFunction<T extends (...args: any[]) => any> = jest.Mock<ReturnType<T>, Parameters<T>>;

export interface Eip1193Provider {
  request: (args: Eip1193RequestArguments) => Promise<unknown>;
  isMetaMask?: boolean;
  isSafePal?: boolean;
  on?: <T extends keyof Eip1193EventMap>(event: T, handler: Eip1193EventMap[T]) => void;
  removeListener?: <T extends keyof Eip1193EventMap>(event: T, handler: Eip1193EventMap[T]) => void;
  isConnected?: () => boolean;
}

export interface Eip1193DisconnectEvent {
  code?: number;
  message?: string;
  data?: unknown;
}

export type Eip1193EventMap = Record<string, Eip1193EventHandler> & {
  accountsChanged: (accounts: string[]) => void;
  chainChanged: (chainIdHex: string) => void;
  disconnect: (error: Eip1193DisconnectEvent) => void;
};

type RequestFn = Eip1193Provider['request'];
type OnFn = NonNullable<Eip1193Provider['on']>;
type RemoveListenerFn = NonNullable<Eip1193Provider['removeListener']>;

export type MockedEip1193Provider = Omit<Eip1193Provider, 'request' | 'on' | 'removeListener'> & {
  request: JestMockedFunction<RequestFn>;
  on: JestMockedFunction<OnFn>;
  removeListener: JestMockedFunction<RemoveListenerFn>;
};

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

export const setWindowProvider = <K extends keyof WalletWindow>(key: K, value: WalletWindow[K]) => {
  (global as unknown as { window: WalletWindow }).window[key] = value;
};

export const clearWindowProvider = <K extends keyof WalletWindow>(key: K) => {
  delete (global as unknown as { window: WalletWindow }).window[key];
};
