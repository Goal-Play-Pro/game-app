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

import { useWallet } from '../useWallet';

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
  const originalEthereum = (global as any).ethereum;
  let requestMock: jest.Mock;
  let queryClient: QueryClient;

  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeAll(() => {
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
    (global as any).ethereum = originalEthereum;
    (global as any).localStorage = new LocalStorageMock();
    if (queryClient) {
      queryClient.clear();
    }
  });

  const setupProvider = () => {
    requestMock = jest.fn();
    const provider = {
      request: requestMock,
      on: jest.fn(),
      removeListener: jest.fn(),
    };
    (global as any).ethereum = provider;
    return provider;
  };

  it('does not trigger provider requests on mount', () => {
    setupProvider();
    queryClient = new QueryClient();
    renderHook(() => useWallet(), { wrapper: Wrapper });
    expect(requestMock).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent connect attempts', async () => {
    setupProvider();
    requestMock.mockImplementation(({ method }: { method: string }) => {
      if (method === 'eth_requestAccounts') {
        return Promise.resolve(['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266']);
      }
      if (method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

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
  });

  it('blocks eth_sign requests even after provider guard is applied', async () => {
    const provider = setupProvider();
    requestMock.mockResolvedValue(undefined);

    queryClient = new QueryClient();
    renderHook(() => useWallet(), { wrapper: Wrapper });

    await expect(provider.request({ method: 'eth_sign' })).rejects.toThrow(
      'Direct eth_sign requests are blocked for security reasons.',
    );
  });
});
