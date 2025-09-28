/** @jest-environment jsdom */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../services/api', () => {
  const markSessionActive = jest.fn();
  return {
    __esModule: true,
    default: {
      createSiweChallenge: jest.fn().mockResolvedValue({ message: 'challenge', nonce: 'nonce' }),
      verifySiweSignature: jest.fn().mockResolvedValue({}),
      markSessionActive,
      isAuthenticated: jest.fn().mockReturnValue(false),
      ensureSession: jest.fn().mockResolvedValue(false),
      logout: jest.fn().mockResolvedValue(undefined),
    },
  };
});

import { clearPreferredProvider } from '../../utils/providerRegistry';
import { installMockProvider, restoreWindow } from '../../test-utils/walletMocks';
import { enforceWalletRequestGuards, useWallet } from '../useWallet';
import type { WalletWindow } from '../../types/wallet';
import { setWindowProvider, clearWindowProvider } from '../../types/wallet';

const METAMASK_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const SAFEPAL_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

class LocalStorageMock {
  private store = new Map<string, string>();

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

describe('useWallet', () => {
  let originalWindow: Window | undefined;
  let teardownProvider: (() => void) | null;
  let requestMock: jest.Mock;
  let queryClient: QueryClient;

  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    originalWindow = global.window;
    clearPreferredProvider();
    (global as any).localStorage = new LocalStorageMock();
    if (typeof (global as any).CustomEvent === 'undefined') {
      (global as any).CustomEvent = class CustomEvent<T> extends Event {
        detail?: T;
        constructor(type: string, params?: { detail?: T }) {
          super(type);
          this.detail = params?.detail;
        }
      } as unknown as typeof CustomEvent;
    }
  });

  afterEach(() => {
    jest.resetAllMocks();
    restoreWindow(originalWindow);
    (global as any).localStorage = new LocalStorageMock();
    if (teardownProvider) {
      teardownProvider();
      teardownProvider = null;
    }
    clearPreferredProvider();
    if (queryClient) {
      queryClient.clear();
    }
  });

  const setupProvider = (
    overrides: Partial<Parameters<typeof installMockProvider>[0]> = {},
    windowOverrides?: Partial<Pick<WalletWindow, 'ethereum' | 'safePal'>>,
    handler?: (method: string) => any,
  ) => {
    const { provider, requestMock: mock, setRequestHandler, clear } = installMockProvider({
      ...overrides,
    });

    if (windowOverrides) {
      Object.entries(windowOverrides).forEach(([key, value]) => {
        setWindowProvider(key as 'ethereum' | 'safePal', value as WalletWindow['ethereum']);
      });
    }

    requestMock = mock;
    teardownProvider = () => {
      clear();
      if (windowOverrides) {
        Object.keys(windowOverrides).forEach((key) => {
          clearWindowProvider(key as 'ethereum' | 'safePal');
        });
      }
    };

    if (handler) {
      setRequestHandler(({ method }) => handler(method));
    }

    return provider;
  };

  it('does not trigger provider requests on mount', () => {
    setupProvider();
    queryClient = new QueryClient();
    renderHook(() => useWallet(), { wrapper: Wrapper });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent connect attempts', async () => {
    setupProvider(
      { isMetaMask: true },
      undefined,
      (method) => {
        if (method === 'eth_requestAccounts') {
          return Promise.resolve([METAMASK_ADDRESS]);
        }
        if (method === 'eth_chainId') {
          return Promise.resolve('0x1');
        }
        return Promise.resolve(null);
    },
  );

    queryClient = new QueryClient();
    const { result } = renderHook(() => useWallet(), { wrapper: Wrapper });

    await act(async () => {
      await Promise.all([result.current.connectWallet(), result.current.connectWallet()]);
    });

    const accountCalls = requestMock.mock.calls.filter(([arg]) => arg?.method === 'eth_requestAccounts');
    expect(accountCalls).toHaveLength(1);
    expect(result.current.isConnected).toBe(true);
    expect(result.current.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

    const invokedMethods = requestMock.mock.calls.map(([arg]) => arg?.method).filter(Boolean);
    expect(invokedMethods).toContain('eth_chainId');
    expect(invokedMethods).not.toContain('personal_sign');
    expect(invokedMethods).not.toContain('wallet_switchEthereumChain');
    expect(invokedMethods).not.toContain('wallet_addEthereumChain');
    expect(result.current.walletType).toBe('metamask');
    expect(localStorage.getItem('walletType')).toBe('metamask');
  });

  it('flags unsupported chain when connecting on a non-BSC network', async () => {
    setupProvider(
      { isMetaMask: true },
      undefined,
      (method) => {
        if (method === 'eth_requestAccounts') {
          return Promise.resolve([METAMASK_ADDRESS]);
        }
        if (method === 'eth_chainId') {
          return Promise.resolve('0x1');
        }
        return Promise.resolve(null);
      },
    );

    queryClient = new QueryClient();
    const { result } = renderHook(() => useWallet(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.errorCode).toBe(4901);
    expect(result.current.error).toContain('Unsupported chain');
  });

  it('enforces signing guards before authentication is completed', () => {
    expect(() => enforceWalletRequestGuards('eth_sign', { isConnected: true, needsAuth: false })).toThrow(
      'Direct eth_sign requests are blocked for security reasons.',
    );

    expect(() => enforceWalletRequestGuards('eth_signTypedData_v4', { isConnected: true, needsAuth: true })).toThrow(
      'Typed data signatures are only allowed after wallet authentication.',
    );

    expect(() => enforceWalletRequestGuards('eth_signTypedData_v4', { isConnected: true, needsAuth: false })).not.toThrow();
  });

  it('detects SafePal provider and persists wallet type', async () => {
    setupProvider(
      { isSafePal: true },
      undefined,
      (method) => {
        if (method === 'eth_requestAccounts') {
          return Promise.resolve([SAFEPAL_ADDRESS]);
        }
        if (method === 'eth_chainId') {
          return Promise.resolve('0x38');
        }
        if (method === 'eth_accounts') {
          return Promise.resolve([SAFEPAL_ADDRESS]);
        }
        if (method === 'personal_sign') {
          return Promise.resolve('0xsignature');
        }
        return Promise.resolve(null);
      },
    );

    queryClient = new QueryClient();
    const { result } = renderHook(() => useWallet(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.walletType).toBe('safepal');
    expect(localStorage.getItem('walletType')).toBe('safepal');

    expect(result.current.walletType).toBe('safepal');
  });

  it('updates wallet type when switching from MetaMask to SafePal', async () => {
    // First render with MetaMask
    setupProvider(
      { isMetaMask: true },
      undefined,
      (method) => {
        if (method === 'eth_requestAccounts') {
          return Promise.resolve([METAMASK_ADDRESS]);
        }
        if (method === 'eth_chainId') {
          return Promise.resolve('0x38');
        }
        if (method === 'eth_accounts') {
          return Promise.resolve([METAMASK_ADDRESS]);
        }
        return Promise.resolve(null);
      },
    );

    queryClient = new QueryClient();
    const { result, unmount } = renderHook(() => useWallet(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.walletType).toBe('metamask');
    expect(localStorage.getItem('walletType')).toBe('metamask');

    unmount();

    // Initialize hook with persisted state and SafePal available
    setupProvider(
      { isSafePal: true },
      undefined,
      (method) => {
        if (method === 'eth_accounts') {
          return Promise.resolve([SAFEPAL_ADDRESS]);
        }
        if (method === 'eth_chainId') {
          return Promise.resolve('0x38');
        }
        if (method === 'eth_requestAccounts') {
          return Promise.resolve([SAFEPAL_ADDRESS]);
        }
        return Promise.resolve(null);
      },
    );

    queryClient = new QueryClient();
    const { result: safepalResult } = renderHook(() => useWallet(), { wrapper: Wrapper });

    // Ensure state rehydrates with previous value before reconnecting
    expect(safepalResult.current.walletType).toBe('metamask');

    await act(async () => {
      await safepalResult.current.connectWallet();
    });

    expect(safepalResult.current.walletType).toBe('safepal');
    expect(localStorage.getItem('walletType')).toBe('safepal');
  });

  it('resets state when provider disconnects', async () => {
    const disconnectHandlers: Array<(payload: unknown) => void> = [];

    const provider = setupProvider(
      { isMetaMask: true },
      undefined,
      (method) => {
        if (method === 'eth_requestAccounts') {
          return Promise.resolve([METAMASK_ADDRESS]);
        }
        if (method === 'eth_chainId') {
          return Promise.resolve('0x38');
        }
        return Promise.resolve(null);
      },
    );

    provider.on.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'disconnect') {
        disconnectHandlers.push(handler);
      }
    });

    provider.removeListener.mockImplementation((event: string, handler: (...args: unknown[]) => void) => {
      if (event === 'disconnect') {
        const index = disconnectHandlers.indexOf(handler);
        if (index >= 0) {
          disconnectHandlers.splice(index, 1);
        }
      }
    });

    queryClient = new QueryClient();
    const { result } = renderHook(() => useWallet(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.isConnected).toBe(true);

    const disconnectEvent = { code: 4900, message: 'MetaMask disconnected' };
    await act(async () => {
      disconnectHandlers.forEach((handler) => handler(disconnectEvent));
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.errorCode).toBe(4900);
    expect(result.current.error).toContain('disconnected');
  });
});
