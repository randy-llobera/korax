# Stripe Integration Phase 1 - Core Infrastructure

## Overview

Build the billing foundation without shipping live Stripe checkout or billing UI yet.

This phase sets up the shared Stripe and plan infrastructure, exposes Pro status in auth/session state, and adds a dedicated usage-limits module with unit tests for free-tier enforcement rules.

## Requirements

- Install the Stripe SDK dependency
- Add shared Stripe client setup and env validation
- Add shared billing constants and price ID mapping
- Add a dedicated `usage-limits` module for free-tier checks
- Sync `isPro` from the database in the auth JWT callback on every session load
- Expose `session.user.isPro` in NextAuth typings and session data
- Include current billing fields in shared user reads needed by Settings and gating work
- Add unit tests for the `usage-limits` module
- Do not add checkout, billing portal, webhook handling, or billing UI in this phase

## Files to Create

1. `src/lib/billing/stripe.ts` - Stripe client creation and required env checks
2. `src/lib/billing/guards.ts` - plan constants, interval-to-price mapping, billing helpers that do not depend on routes
3. `src/lib/usage-limits.ts` - centralized free-tier limit and Pro-access checks
4. `src/lib/usage-limits.test.ts` - unit tests for item, collection, and Pro-only feature checks

## Files to Modify

1. `package.json` - add `stripe`
2. `src/auth.ts` - reload `isPro` from Prisma in JWT callback and pass it into the session
3. `src/types/next-auth.d.ts` - add `user.isPro` and any JWT typing needed for the callback
4. `src/lib/db/dashboard-user.ts` - include `isPro` and any billing fields needed by later Settings work
5. `.env.example` - add Stripe environment variable placeholders

## Usage-Limits Module

Create a small shared module that is safe to use from server actions, API routes, and UI helpers.

Suggested exports:

- `FREE_TIER_ITEM_LIMIT = 50`
- `FREE_TIER_COLLECTION_LIMIT = 3`
- `canCreateItem`
- `canCreateCollection`
- `canUseFileUploads`
- `canUseImageUploads`
- `canUseAiFeatures`

Keep the module pure. It should accept plain inputs like `isPro`, `itemCount`, and `collectionCount`, and return booleans or simple result objects. Do not read the database directly in this module.

## Testing

Add unit coverage for the new `src/lib/usage-limits.ts` module.

Minimum cases:

1. Free user can create items below the limit
2. Free user is blocked at `50` items
3. Free user can create collections below the limit
4. Free user is blocked at `3` collections
5. Free user cannot use file uploads
6. Free user cannot use image uploads
7. Pro user bypasses all free-tier limits

Verification commands:

```bash
npm run test -- src/lib/usage-limits.test.ts
npm run lint
```

Success looks like:

- The usage-limits test file passes
- Lint passes with no new errors

## Key Gotchas

- Do not rely on stale session state after Stripe updates. `isPro` must be re-read from Prisma in the JWT callback.
- Keep free-tier rule logic centralized. Do not spread limit constants across actions and routes.
- Do not add route handlers in this phase. The goal is to land stable shared infrastructure first.

## References

- `docs/stripe-integration-plan.md`
- `context/project-overview.md`
- `context/coding-standards.md`
- `src/auth.ts`
- `src/lib/db/dashboard-user.ts`
