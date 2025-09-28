/** @jest-environment jsdom */

import { shareContent, showCopyNotification } from './share.utils';

type MutableNavigatorProps = 'share' | 'canShare' | 'clipboard';

const setNavigatorProperty = <K extends MutableNavigatorProps>(key: K, value: Navigator[K]) => {
  Object.defineProperty(navigator, key, {
    configurable: true,
    value,
    writable: false,
  });
};

const deleteNavigatorProperty = (key: MutableNavigatorProps) => {
  delete (navigator as unknown as Record<string, unknown>)[key];
};

const originalNavigatorState: Record<MutableNavigatorProps, Navigator[MutableNavigatorProps]> = {
  share: navigator.share,
  canShare: navigator.canShare,
  clipboard: navigator.clipboard,
};

const restoreNavigatorProperty = (key: MutableNavigatorProps) => {
  const originalValue = originalNavigatorState[key];
  if (typeof originalValue === 'undefined') {
    deleteNavigatorProperty(key);
  } else {
    setNavigatorProperty(key, originalValue);
  }
};

describe('shareContent', () => {
  const originalPrompt = global.prompt;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    (document as any).execCommand = jest.fn();
    global.prompt = undefined as any;
  });

  afterEach(() => {
    (['share', 'canShare', 'clipboard'] as MutableNavigatorProps[]).forEach(restoreNavigatorProperty);
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
    const shareMock = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<NonNullable<Navigator['share']>>;
    setNavigatorProperty('share', shareMock);
    setNavigatorProperty('canShare', jest.fn().mockReturnValue(true) as Navigator['canShare']);

    const result = await shareContent(sampleShare);

    expect(shareMock).toHaveBeenCalledWith(sampleShare);
    expect(result).toEqual({ success: true, method: 'webshare' });
  });

  it('falls back to clipboard API on share failure', async () => {
    setNavigatorProperty('share', jest.fn().mockRejectedValue(new Error('fail')) as Navigator['share']);
    setNavigatorProperty('canShare', jest.fn().mockReturnValue(true) as Navigator['canShare']);
    setNavigatorProperty(
      'clipboard',
      {
        writeText: jest.fn().mockResolvedValue(undefined),
      } as unknown as Navigator['clipboard'],
    );

    const result = await shareContent(sampleShare, { showNotification: false });

    expect(navigator.clipboard?.writeText).toHaveBeenCalledWith(sampleShare.url);
    expect(result).toEqual({ success: true, method: 'clipboard' });
  });

  it('prompts user when clipboard APIs unavailable', async () => {
    setNavigatorProperty('share', undefined);
    setNavigatorProperty('clipboard', undefined as unknown as Navigator['clipboard']);
    (document.execCommand as jest.Mock).mockReturnValue(false);
    global.prompt = jest.fn().mockReturnValue('copied');

    const result = await shareContent(sampleShare, { fallbackToPrompt: true, showNotification: false });
    expect(global.prompt).toHaveBeenCalled();
    expect(result).toEqual({ success: true, method: 'prompt' });
  });

  it('returns failure when all methods fail', async () => {
    setNavigatorProperty('share', undefined);
    setNavigatorProperty('clipboard', undefined as unknown as Navigator['clipboard']);
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
