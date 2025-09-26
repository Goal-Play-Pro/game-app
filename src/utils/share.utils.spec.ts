/** @jest-environment jsdom */

import { shareContent, showCopyNotification } from './share.utils';

declare global {
  interface Navigator {
    share?: jest.Mock;
    canShare?: jest.Mock;
    clipboard?: { writeText: jest.Mock };
  }
}

describe('shareContent', () => {
  const originalNavigator = { ...global.navigator };
  const originalPrompt = global.prompt;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    (document as any).execCommand = jest.fn();
    global.prompt = undefined as any;
  });

  afterEach(() => {
    Object.assign(navigator, originalNavigator);
    global.prompt = originalPrompt as any;
    document.getElementById('copy-notification')?.remove();
    document.getElementById('copy-notification-styles')?.remove();
  });

  const sampleShare = {
    title: 'Goal Play',
    text: 'Join the penalty shootout',
    url: 'https://goal.play',
  };

  it('uses Web Share API when available', async () => {
    const shareMock = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareMock, configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn().mockReturnValue(true), configurable: true });

    const result = await shareContent(sampleShare);

    expect(shareMock).toHaveBeenCalledWith(sampleShare);
    expect(result).toEqual({ success: true, method: 'webshare' });
  });

  it('falls back to clipboard API on share failure', async () => {
    Object.defineProperty(navigator, 'share', { value: jest.fn().mockRejectedValue(new Error('fail')), configurable: true });
    Object.defineProperty(navigator, 'canShare', { value: jest.fn().mockReturnValue(true), configurable: true });
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn().mockResolvedValue(undefined) },
      configurable: true,
    });

    const result = await shareContent(sampleShare, { showNotification: false });

    expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith(sampleShare.url);
    expect(result).toEqual({ success: true, method: 'clipboard' });
  });

  it('prompts user when clipboard APIs unavailable', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    (document.execCommand as jest.Mock).mockReturnValue(false);
    global.prompt = jest.fn().mockReturnValue('copied');

    const result = await shareContent(sampleShare, { fallbackToPrompt: true, showNotification: false });
    expect(global.prompt).toHaveBeenCalled();
    expect(result).toEqual({ success: true, method: 'prompt' });
  });

  it('returns failure when all methods fail', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    (document.execCommand as jest.Mock).mockReturnValue(false);
    global.prompt = jest.fn().mockReturnValue(null);

    const result = await shareContent(sampleShare, { fallbackToPrompt: true, showNotification: false });
    expect(result).toEqual({ success: false, method: 'failed' });
  });
});

describe('showCopyNotification', () => {
  afterEach(() => {
    document.getElementById('copy-notification')?.remove();
    document.getElementById('copy-notification-styles')?.remove();
  });

  it('creates and removes notification element', () => {
    jest.useFakeTimers();
    showCopyNotification('Copied!', 1000);

    const notification = document.getElementById('copy-notification');
    expect(notification).not.toBeNull();
    expect(notification?.textContent).toBe('Copied!');

    jest.advanceTimersByTime(1500);
    jest.runOnlyPendingTimers();

    expect(document.getElementById('copy-notification')).toBeNull();
    jest.useRealTimers();
  });
});
