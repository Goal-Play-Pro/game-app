const loggedPages = new Set<string>();

export const logWalletRequirement = (pageName: string) => {
  if (typeof window === 'undefined' || !globalThis.window) {
    return;
  }

  if (loggedPages.has(pageName)) {
    return;
  }

  console.info(`🔒 Wallet required: connect your wallet to use the ${pageName}.`);
  loggedPages.add(pageName);
};
