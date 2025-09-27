# Goal Play Compliance Checklist

## Wallet & Provider (EIP-1193 / EIP-1102 / EIP-6963)
- `src/hooks/useWallet.ts`: click-gated `eth_requestAccounts`, concurrency guard (`isConnectingRef`), EIP-6963 discovery, frame suppression, request sanitisation (`eth_sign` blocked, typed data gated). Tests: `src/hooks/__tests__/useWallet.spec.tsx`.

## Signature & Authentication (EIP-4361 / EIP-1271 / EIP-712)
- CAIP-10 identifiers stored + returned; SIWE/Solana flows emit `primaryWalletCaip10` (`src/modules/auth/auth.service.ts`).
- ERC-1271 verification per-chain providers (`src/common/services/crypto.service.ts`, spec coverage).
- Client blocks `eth_sign` upfront, typed data gated post-auth (`useWallet`).
- SIWE domain normalised via UTS-46, nonce/chain binding enforced (`auth.service` tests).

## JWT (RFC 7519 / 8725)
- Config enforces secret length, alg whitelist, KID rotation, exp/iat/aud, clock tolerance (`src/common/config/jwt.config.ts`).
- Strategy validates header & claims (`src/modules/auth/strategies/jwt.strategy.ts`). Tests: `src/common/config/jwt.config.spec.ts`, `src/modules/auth/auth.service.spec.ts`.

## HTTP Security (RFC 9110 / RFC 6797 / CSP3)
- HTTPS redirect + HSTS + CSP nonce + frameguard + referrer policy (`src/main.ts`). Test: `test/security-headers.e2e-spec.ts`.

## Cross-Origin / Embedding
- Wallet connect disabled in frames; provider guard enforced (`useWallet`).
- Embedded YouTube sandboxed (`src/pages/VideosPage.tsx`).

## CAIP-10 & Unicode
- Helpers in `src/common/utils/caip10.util.ts`; persisted across DB + API.
- SIWE domain/origin normalised with UTS-46.
- AuthService specs assert CAIP usage.

## How to Validate
1. `pnpm install`
2. `pnpm test`
3. Manual wallet smoke test (connect -> sign in -> ensure no warnings).
4. CI: GitHub workflow `.github/workflows/compliance.yml` runs the full Jest suite on Node 20/22/24 to guard regressions.

## Follow-ups
- Backfill CAIP-10 columns in production DB.
- Expand UI tests to cover button states with wallet mocks.
