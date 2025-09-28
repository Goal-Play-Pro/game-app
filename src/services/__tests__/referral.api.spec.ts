jest.mock('../../config/api.config', () => ({
  API_CONFIG: {
    FRONTEND_URL: 'https://goal.play',
  },
}));

import { ReferralApiService } from '../referral.api';

describe('ReferralApiService mock helpers', () => {
  it('returns a referral code object with ISO timestamps', async () => {
    const code = await ReferralApiService.getMyReferralCode();

    expect(code.code).toBeTruthy();
    expect(typeof code.totalReferrals).toBe('number');
    expect(() => Date.parse(code.createdAt as unknown as string)).not.toThrow();
    expect(() => Date.parse(code.updatedAt as unknown as string)).not.toThrow();
  });

  it('provides referral stats with empty arrays and formatted link', async () => {
    const stats = await ReferralApiService.getReferralStats();

    expect(stats.referralLink).toContain('?ref=');
    expect(Array.isArray(stats.recentReferrals)).toBe(true);
    expect(Array.isArray(stats.recentCommissions)).toBe(true);
    expect(stats.totalReferrals).toBe(0);
  });
});
