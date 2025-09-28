import { PaymentMonitorService } from '../payment-monitor.service';

describe('PaymentMonitorService helpers', () => {
  const orderRepository = {
    update: jest.fn(),
    count: jest.fn(),
    find: jest.fn(),
  };
  const blockchainService = {} as any;
  const orderService = {} as any;
  const service = new PaymentMonitorService(orderRepository as any, blockchainService, orderService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('compares USDT amounts with tolerance', () => {
    expect((service as any).compareUSDTAmounts('1000000000000000000', '1.00')).toBe(true);
    expect((service as any).compareUSDTAmounts('1000000000000000000', '1.20')).toBe(false);
  });

  it('builds a monitoring report using repository aggregates', async () => {
    orderRepository.count.mockImplementation(async ({ where }) => {
      switch (where?.status) {
        case 'pending':
          return 2;
        case 'expired':
          return 1;
        case 'paid':
          return 6;
        default:
          return 0;
      }
    });
    orderRepository.find.mockResolvedValue([{ id: 'under-review-1' }, { id: 'under-review-2' }]);

    const report = await service.getMonitoringReport();

    expect(report.pendingOrders).toBe(2);
    expect(report.expiredOrders).toBe(1);
    expect(report.totalVerified).toBe(6);
    expect(report.suspiciousTransactions).toBe(2);
    expect(new Date(report.lastCheck).getTime()).not.toBeNaN();
  });
});
