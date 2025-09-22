import type { EtherscanConfig } from '../../config/etherscan.config';

describe('EtherscanClient request handling', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalFetch) {
      global.fetch = originalFetch;
    } else {
      delete (global as any).fetch;
    }
    delete process.env.ETHERSCAN_API_KEY;
    delete process.env.ETHERSCAN_BASE_URL;
    delete process.env.ETHERSCAN_FEATURE_FLAG_V2;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it('builds the correct URL and returns result data', async () => {
    process.env.ETHERSCAN_API_KEY = 'integration-test';
    process.env.ETHERSCAN_BASE_URL = 'https://api.etherscan.io/v2/api';
    process.env.ETHERSCAN_FEATURE_FLAG_V2 = 'false';

    jest.resetModules();
    const { ETHERSCAN_CONFIG } = await import('../../config/etherscan.config');
    const { EtherscanClient } = await import('../etherscan.client');

    Object.assign(ETHERSCAN_CONFIG, {
      apiKey: 'integration-test',
      baseUrl: 'https://api.etherscan.io/v2/api',
      defaultChainId: '56',
      featureFlagV2: false,
    } as Partial<EtherscanConfig>);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: '1', result: [{ hash: '0x01' }] }),
      headers: { get: () => null },
    } as any);
    global.fetch = fetchMock as any;

    const client = new EtherscanClient();
    const result = await client.request<{ hash: string }[]>({
      module: 'account',
      action: 'tokentx',
      params: {
        address: '0xabc',
        page: 1,
      },
    });

    expect(result).toEqual([{ hash: '0x01' }]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('chainid=56');
    expect(calledUrl).toContain('module=account');
    expect(calledUrl).toContain('action=tokentx');
    expect(calledUrl).toContain('address=0xabc');
    expect(calledUrl).toContain('page=1');
    expect(calledUrl).toContain('apikey=integration-test');
  });

  it('surfaces provider rate limit errors', async () => {
    process.env.ETHERSCAN_API_KEY = 'integration-test';
    process.env.ETHERSCAN_FEATURE_FLAG_V2 = 'false';

    jest.resetModules();
    const { ETHERSCAN_CONFIG } = await import('../../config/etherscan.config');
    const { EtherscanClient, EtherscanClientError } = await import('../etherscan.client');

    Object.assign(ETHERSCAN_CONFIG, {
      apiKey: 'integration-test',
      featureFlagV2: false,
    } as Partial<EtherscanConfig>);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: '0', message: 'NOTOK Rate limit reached' }),
      headers: { get: () => null },
    } as any);
    global.fetch = fetchMock as any;

    const client = new EtherscanClient();

    await expect(
      client.request({ module: 'account', action: 'balance', params: { address: '0xabc' } })
    ).rejects.toBeInstanceOf(EtherscanClientError);
  });
});
