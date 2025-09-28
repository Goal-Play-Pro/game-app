import { BlockchainService } from '../blockchain.service';
import { EtherscanClientError } from '../etherscan.client';

let mockWeb3Instance: any;
const web3Constructor = jest.fn(() => mockWeb3Instance);

jest.mock('web3', () => ({
  Web3: function (...args: any[]) {
    return web3Constructor(...args);
  },
}));

describe('BlockchainService', () => {
  let service: BlockchainService;
  let etherscanClient: { request: jest.Mock };

  beforeEach(() => {
    mockWeb3Instance = {
      eth: {
        getTransaction: jest.fn(),
        getTransactionReceipt: jest.fn(),
        getBlockNumber: jest.fn().mockResolvedValue(200),
        Contract: jest.fn(),
      },
    };
    etherscanClient = { request: jest.fn() };
    service = new BlockchainService(etherscanClient as any);
    (service as any).web3 = mockWeb3Instance;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns transactions returned by Etherscan', async () => {
    const sample = [{ hash: '0x123' }, { hash: '0x456' }];
    etherscanClient.request.mockResolvedValue(sample);

    const result = await service.getUSDTTransactionsForAddress('0xabc', 10, 20);

    expect(result).toEqual(sample);
    expect(etherscanClient.request).toHaveBeenCalledWith({
      module: 'account',
      action: 'tokentx',
      params: {
        contractaddress: expect.any(String),
        address: '0xabc',
        startblock: '10',
        endblock: '20',
        sort: 'desc',
      },
    });
  });

  it('returns an empty list when the Etherscan client throws', async () => {
    etherscanClient.request.mockRejectedValue(new EtherscanClientError('rate limited', 429, {}));

    const result = await service.getUSDTTransactionsForAddress('0xabc');

    expect(result).toEqual([]);
  });

  it('fails verification when transaction cannot be found', async () => {
    mockWeb3Instance.eth.getTransaction.mockResolvedValue(null);

    const result = await service.verifyUSDTTransaction('0xmissing', '0xfrom', '0xto', '1');

    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Transaction not found');
  });

  it('retrieves the USDT balance through the contract wrapper', async () => {
    const callMock = jest.fn().mockResolvedValue('1000000000000000000');
    mockWeb3Instance.eth.Contract.mockReturnValue({
      methods: {
        balanceOf: () => ({ call: callMock }),
      },
    });

    const balance = await service.getUSDTBalance('0xwallet');

    expect(mockWeb3Instance.eth.Contract).toHaveBeenCalled();
    expect(balance).toBe('1');
  });
});
