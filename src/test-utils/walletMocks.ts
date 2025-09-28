import type {
  Eip1193RequestArguments,
  Eip1193Provider,
  MockedEip1193Provider,
  WalletWindow,
  JestMockedFunction,
} from '../types/wallet';

export interface MockProviderOptions {
  readonly isMetaMask?: boolean;
  readonly isSafePal?: boolean;
  readonly requestImplementation?: (args: Eip1193RequestArguments) => unknown | Promise<unknown>;
  readonly info?: Partial<Eip1193Provider>;
}

export interface MockProviderApi {
  provider: MockedEip1193Provider;
  requestMock: JestMockedFunction<RequestFn>;
  setRequestHandler: (handler: (args: Eip1193RequestArguments) => unknown | Promise<unknown>) => void;
  clear: () => void;
}

const ensureWindow = (): WalletWindow => {
  if (typeof window === 'undefined') {
    throw new Error('global window is not defined');
  }
  return window as WalletWindow;
};

type RequestFn = Eip1193Provider['request'];
type OnFn = NonNullable<Eip1193Provider['on']>;
type RemoveListenerFn = NonNullable<Eip1193Provider['removeListener']>;

export const installMockProvider = (options: MockProviderOptions = {}): MockProviderApi => {
  const win = ensureWindow();
  const requestMock: JestMockedFunction<RequestFn> = jest.fn<ReturnType<RequestFn>, Parameters<RequestFn>>();
  const onMock: JestMockedFunction<OnFn> = jest.fn<ReturnType<OnFn>, Parameters<OnFn>>();
  const removeListenerMock: JestMockedFunction<RemoveListenerFn> =
    jest.fn<ReturnType<RemoveListenerFn>, Parameters<RemoveListenerFn>>();

  requestMock.mockImplementation(async (args) => {
    if (options.requestImplementation) {
      return options.requestImplementation(args);
    }
    throw new Error(`Unexpected request ${args.method}`);
  });

  const provider: MockedEip1193Provider = {
    request: requestMock,
    on: onMock,
    removeListener: removeListenerMock,
    isMetaMask: options.isMetaMask,
    isSafePal: options.isSafePal,
  };

  if (options.info) {
    Object.assign(provider, options.info);
  }

  win.ethereum = provider;
  if (provider.isSafePal) {
    win.safePal = provider;
  }

  const setRequestHandler = (
    handler: (args: Eip1193RequestArguments) => unknown | Promise<unknown>,
  ) => {
    requestMock.mockImplementation(async (args) => handler(args));
  };

  const clear = () => {
    const current = ensureWindow();
    if (current.ethereum === provider) {
      delete current.ethereum;
    }
    if (current.safePal === provider) {
      delete current.safePal;
    }
  };

  return {
    provider,
    requestMock,
    setRequestHandler,
    clear,
  };
};

export const restoreWindow = (originalWindow: Window | undefined) => {
  if (typeof originalWindow !== 'undefined') {
    (global as unknown as { window: Window }).window = originalWindow;
  }
};
