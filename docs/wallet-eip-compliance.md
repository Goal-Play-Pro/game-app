# Wallet Compliance Guide

_Updated: 2025-09-28_

## Provider Discovery & Selection
- Prefer providers announced through **EIP-6963**.
- Listen for `eip6963:announceProvider` and dispatch `eip6963:requestProvider` on mount.
- Persist the preferred provider (MetaMask wins ties) via `providerRegistry` to keep React hooks and service modules in sync.
- Only fall back to `window.ethereum` when no announced provider exists.

## Connection, Permissions & Events (EIP-1193 / EIP-1102)
- Gate all wallet calls behind user gestures (no automatic prompts on load).
- `connectWallet` requests `eth_requestAccounts` within the click handler.
- `accountsChanged`, `chainChanged`, and `disconnect` are subscribed after connect; `disconnect` clears local state and resets session.
- Accounts or chain changes invalidate the session and require re-authentication.

## Network Management (EIP-3085 / EIP-3326)
- `switchToNetwork(56)` uses `wallet_switchEthereumChain` and retries via `wallet_addEthereumChain` with official BSC metadata when code `4902` is returned.
- Post-connect banner in `WalletConnect` nudges the user to switch to `0x38` (BNB Chain) and surfaces inline status while the request is pending.

## Signing & Requests (EIP-1193 / EIP-712)
- `eth_sign` is blocked (`enforceWalletRequestGuards`).
- `personal_sign` prompts only after authentication state is ready; order of params is `[message, address]`.
- Typed data signatures require authenticated state before `eth_signTypedData_v4` is allowed.

## Error Semantics (EIP-1474)
- `normalizeWalletError` wraps every RPC call, mapping wallet errors to `WalletRpcError(code, message)` instances.
- Common codes:
  - `4001`: user rejected request
  - `4900`: provider disconnected
  - `4901`: unsupported chain / switch required
  - `4902`: chain missing from wallet
- `formatWalletErrorMessage` converts codes into user-facing copy (payment modal, wallet banner, etc.).

## Security Controls
- No proxies or mutation of `window.ethereum` beyond discovery.
- No hidden iframes or background polling spikes.
- HTTP requests are blocked; app enforces HTTPS and CSP via backend `helmet` configuration.

## Tests & Tooling
- Wallet hook tests (MetaMask/SafePal) use typed provider mocks: `pnpm test -- src/hooks/useWallet.ts src/hooks/__tests__/useWallet.spec.tsx`
- Payment flow tests ensure EIP-1474 error surfacing: `pnpm test -- src/hooks/__tests__/usePayment.spec.tsx`
- Payment modal network banner: `pnpm test -- src/components/payment/__tests__/PaymentModal.spec.tsx`
- Wallet-only strict type check: `pnpm wallet:strict` *(fails today on known legacy issues outside wallet scope; see backlog section below).

## Operational Runbook
1. **New provider detected?** Confirm `providerRegistry` selects the MetaMask entry (check console logs, `WalletConnect` dropdown).
2. **Unsupported chain on connect:** Ensure inline banner appears; click “Switch to BSC” and verify MetaMask prompt shows BNB metadata.
3. **Payment rejection:** User rejection returns code `4001` and friendly copy “You rejected the request in your wallet. Approve it to continue.”
4. **Disconnect handling:** MetaMask “Disconnect” clears state, removes provider from registry, and toggles UI back to connect state.

## Known Strict-Mode Debt (tracked)
| Area | File(s) | Issue | Suggested Fix | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| Data mappings | `src/data/players.data.ts` | String index accessors on typed objects break `noImplicitAny`. | Refactor to typed records or enums for tiers (`Record<'primera' | 'segunda' | 'tercera', string>`). | Frontend data team | ✅ Completed (typed records added) |
| API DTOs | `src/services/api.ts` | Mock payloads use loose string enums (`Product.type`, `ProductVariant`) causing assignability errors. | Introduce discriminated unions / align with backend DTOs for products and variants. | Backend/Frontend integration | ✅ Completed (fallback DTOs now use enums & `Date` instances) |
| Wallet listeners | `src/hooks/useWallet.ts` | `provider.on/removeListener` handlers currently infer `unknown[]`, failing under `strict`. | Add explicit listener typing (`(accounts: string[]) => void`, etc.) via helper wrappers. | Wallet team | ✅ Completed (typed event map + listener wrappers) |
| Test mocks | `src/test-utils/walletMocks.ts` | Intersection with `jest.Mock` conflicts with EIP interfaces. | Create dedicated `MockEip1193Provider` interface extending `jest.Mocked<Eip1193Provider>`. | QA/Test infra | ✅ Completed (typed mock wrapper & helpers) |
| Legacy types | `src/types/index.ts` | Missing `TransactionType` export referenced across services. | Define/restore `TransactionType` enum or adjust consumers. | Backend types | ✅ Completed (enum restored) |
| Global window typing | `src/hooks/__tests__/useWallet.spec.tsx` | Casting to `Record<string, unknown>` triggers `strict` error. | Wrap window mutations in helper that casts via `unknown` first. | QA/Test infra | ✅ Completed (window helpers added) |
