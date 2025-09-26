describe('logWalletRequirement', () => {
  const originalWindow = global.window;

  afterAll(() => {
    if (originalWindow === undefined) {
      delete (global as any).window;
    } else {
      (global as any).window = originalWindow;
    }
  });

  it('logs once per page when window exists', async () => {
    await jest.isolateModulesAsync(async () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      (global as any).window = { location: { href: 'https://goal.play' } } as any;

      const { logWalletRequirement } = await import('./wallet.utils');
      logWalletRequirement('Profile page');
      logWalletRequirement('Profile page');

      expect(infoSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).toHaveBeenCalledWith('🔒 Wallet required: connect your wallet to use the Profile page.');

      infoSpy.mockRestore();
    });
  });

  it('does not log when window is undefined', async () => {
    await jest.isolateModulesAsync(async () => {
      const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
      delete (global as any).window;

      const { logWalletRequirement } = await import('./wallet.utils');
      logWalletRequirement('Server-side render');

      expect(infoSpy).not.toHaveBeenCalled();
      infoSpy.mockRestore();
    });
  });
});
