# Stripe Integration Phase 2 - Integration and UI

## Overview

Ship the user-facing Stripe flow on top of the Phase 1 billing foundation.

This phase adds checkout and billing portal routes, Stripe webhook handling, server-side feature gating, and the billing UI in Settings plus related entry points. Webhook verification and end-to-end billing flow checks require the Stripe CLI during local testing.

## Requirements

- Add Stripe checkout session creation for monthly and yearly Pro plans
- Add Stripe billing portal session creation for existing Pro customers
- Add a Stripe webhook route that verifies signatures and syncs billing state
- Enforce feature gating on item creation, collection creation, and uploads using the shared Phase 1 usage-limit helpers
- Update the create-item flow so free users cannot create file or image items
- Add a billing section in Settings with upgrade and manage-billing actions
- Update signed-in pricing CTA paths to send users to billing
- Keep server-side gating as the source of truth even if UI controls are hidden or disabled

## Files to Create

1. `src/app/api/stripe/checkout/route.ts` - authenticated checkout session creation
2. `src/app/api/stripe/portal/route.ts` - authenticated billing portal session creation
3. `src/app/api/webhooks/stripe/route.ts` - raw-body webhook verification and billing sync
4. `src/components/settings/billing-settings.tsx` - plan status, upgrade buttons, manage billing button, and usage summary
5. `src/app/api/stripe/checkout/route.test.ts` - route-level tests for checkout request handling
6. `src/app/api/stripe/portal/route.test.ts` - route-level tests for portal request handling
7. `src/app/api/webhooks/stripe/route.test.ts` - route-level tests for webhook event handling

## Files to Modify

1. `src/actions/items.ts` - enforce item-count limits and block free file/image item creation
2. `src/actions/collections.ts` - enforce collection-count limits for free users
3. `src/app/api/uploads/route.ts` - require Pro before accepting file or image uploads
4. `src/app/settings/page.tsx` - render the billing settings section
5. `src/components/dashboard/create-item-dialog.tsx` - hide or disable Pro-only item types for free users
6. `src/components/layout/sidebar.tsx` - keep Pro labeling and optionally route free users toward billing
7. `src/components/homepage/homepage-pricing.tsx` - send signed-in users to Settings billing instead of the generic dashboard path

## Webhook Scope

Handle these events in v1:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Sync rules:

- Set `isPro = true` for `active` and `trialing`
- Set `isPro = false` for canceled, unpaid, incomplete-expired, or missing subscription states
- Persist `stripeCustomerId` and `stripeSubscriptionId` when available

## Feature Gating Scope

Use the Phase 1 shared helpers as the single source of truth for these checks:

- Free users are limited to `50` items
- Free users are limited to `3` collections
- Free users cannot create `file` items
- Free users cannot create `image` items
- Free users cannot upload files or images through the uploads API

Do not rely on UI-only gating. Every restricted path must also be blocked in server actions or API routes.

## Testing

This phase requires both automated tests and local Stripe CLI verification.

Automated verification commands:

```bash
npm run test -- src/app/api/stripe/checkout/route.test.ts src/app/api/stripe/portal/route.test.ts src/app/api/webhooks/stripe/route.test.ts
npm run lint
```

Local integration setup:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
npm run dev
```

Suggested local flow checks:

1. Start the app and Stripe CLI forwarding
2. Trigger checkout from Settings with a test account
3. Complete payment in Stripe test mode
4. Confirm the webhook updates `users.isPro`
5. Refresh Settings and confirm the UI switches to manage billing
6. Verify free-user item, collection, and upload restrictions before upgrade
7. Verify the same restricted actions succeed after upgrade
8. Cancel or modify the subscription in Stripe and confirm webhook-driven state changes

Success looks like:

- Route tests pass
- Lint passes with no new errors
- Stripe CLI shows webhook deliveries to the local endpoint
- Local billing state changes are reflected in the app after webhook processing

## Key Gotchas

- Stripe webhooks must verify signatures against the raw request body
- Checkout and portal routes must require auth
- Metadata should include `userId` on both checkout session and subscription creation paths to make user mapping reliable
- UI gating is secondary. Server-side enforcement is mandatory
- Local webhook testing depends on Stripe CLI forwarding, not only mocked tests

## References

- `docs/stripe-integration-plan.md`
- `context/project-overview.md`
- `context/coding-standards.md`
- `src/actions/items.ts`
- `src/actions/collections.ts`
- `src/app/api/uploads/route.ts`
- `src/app/settings/page.tsx`
