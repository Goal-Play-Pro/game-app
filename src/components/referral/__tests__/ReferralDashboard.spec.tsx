/** @jest-environment jsdom */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReferralDashboard from '../ReferralDashboard';

const mockGetReferralStats = jest.fn();
const mockGetMyReferralCode = jest.fn();
const mockCreateReferralCode = jest.fn();
const mockShareContent = jest.fn();
const mockUseAuthStatus = jest.fn();
const mockGetStoredWallet = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    getReferralStats: (...args: unknown[]) => mockGetReferralStats(...args),
    getMyReferralCode: (...args: unknown[]) => mockGetMyReferralCode(...args),
    createReferralCode: (...args: unknown[]) => mockCreateReferralCode(...args),
  },
}));

jest.mock('../../../utils/share.utils', () => ({
  shareContent: (...args: unknown[]) => mockShareContent(...args),
}));

jest.mock('../../../hooks/useAuthStatus', () => ({
  useAuthStatus: () => mockUseAuthStatus(),
}));

jest.mock('../../../utils/walletStorage', () => ({
  getStoredWallet: () => mockGetStoredWallet(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, cacheTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  const Wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { Wrapper, queryClient };
};

const baseReferralStats = {
  totalReferrals: 3,
  activeReferrals: 2,
  totalCommissions: '42.00',
  pendingCommissions: '5.00',
  paidCommissions: '37.00',
  thisMonthCommissions: '10.00',
  referralLink: 'https://goal.play?ref=GOAL',
  recentReferrals: [],
  recentCommissions: [],
};

const baseReferralCode = {
  id: 'code-1',
  userId: 'user-1',
  walletAddress: '0xabc',
  walletAddressCaip10: 'eip155:56:0xabc',
  code: 'GOAL123',
  isActive: true,
  totalReferrals: 5,
  totalCommissions: '12.00',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: jest.fn() },
    configurable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuthStatus.mockReturnValue(true);
  mockGetStoredWallet.mockReturnValue({
    isConnected: true,
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    caip10: 'eip155:56:0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  });
  mockGetMyReferralCode.mockResolvedValue(baseReferralCode);
  mockCreateReferralCode.mockResolvedValue(baseReferralCode);
  mockShareContent.mockResolvedValue({ success: true });
});

describe('ReferralDashboard', () => {
  const renderComponent = async () => {
    const { Wrapper } = createWrapper();
    render(
      <Wrapper>
        <ReferralDashboard />
      </Wrapper>,
    );

    await waitFor(() => expect(mockGetReferralStats).toHaveBeenCalled());
  };

  it('renders stats and computes monthly referral count from recent referrals', async () => {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() === 0 ? 11 : now.getMonth() - 1);

    mockGetReferralStats.mockResolvedValue({
      ...baseReferralStats,
      recentReferrals: [
        {
          id: 'ref-1',
          referrerUserId: 'user-1',
          referrerWallet: '0xabc',
          referredUserId: 'user-2',
          referredWallet: '0x999',
          referralCode: 'GOAL123',
          registeredAt: now.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          isActive: true,
        },
        {
          id: 'ref-2',
          referrerUserId: 'user-1',
          referrerWallet: '0xabc',
          referredUserId: 'user-3',
          referredWallet: '0xAAA',
          referralCode: 'GOAL123',
          registeredAt: lastMonth.toISOString(),
          createdAt: lastMonth.toISOString(),
          updatedAt: lastMonth.toISOString(),
          isActive: false,
        },
        {
          id: 'ref-3',
          referrerUserId: 'user-1',
          referrerWallet: '0xabc',
          referredUserId: 'user-4',
          referredWallet: '0xBBB',
          referralCode: 'GOAL123',
          registeredAt: '',
          createdAt: 'not-a-date',
          updatedAt: now.toISOString(),
          isActive: true,
        },
      ],
    });

    await renderComponent();

    await waitFor(() => screen.getByText('Your Referral Link'));
    const thisMonthLabel = screen.getByText('This Month');
    const valueNode = thisMonthLabel.parentElement?.querySelector('h3');
    expect(valueNode?.textContent).toBe('1');
    expect(screen.getByText('Unknown date')).toBeTruthy();
  });

  it('invokes shareContent when the share button is clicked', async () => {
    mockGetReferralStats.mockResolvedValue({
      ...baseReferralStats,
      recentReferrals: [],
    });

    await renderComponent();

    await waitFor(() => screen.getByRole('button', { name: /share/i }));
    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => expect(mockShareContent).toHaveBeenCalledTimes(1));
    expect(mockShareContent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Join Goal Play with my referral link!',
        url: 'https://goal.play?ref=GOAL',
      }),
      expect.any(Object),
    );
  });
});
