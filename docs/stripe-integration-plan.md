# Stripe Integration Plan

## Goal

Add Stripe subscriptions for Korax Pro with:

- Monthly plan: `$8/month`
- Yearly plan: `$72/year`
- Free tier limits: `50 items`, `3 collections`
- Pro unlocks: file uploads, image uploads, AI features

Keep the first slice small:

1. Sell Pro
2. Sync `isPro` from Stripe webhooks
3. Enforce current free-tier limits on features that already exist
4. Add billing controls in Settings

## Current State

### Schema

The current Prisma `User` model already has the core billing fields:

```prisma
model User {
  id                   String   @id @default(cuid())
  email                String   @unique
  isPro                Boolean  @default(false)
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  // ...
}
```

This is enough for the first Stripe integration. No schema change is required for the initial rollout.

Tradeoff:

- You will not store billing interval, period end, or cancel-at-period-end locally.
- If the UI later needs that detail, fetch it from Stripe using `stripeSubscriptionId` or add fields in a later migration.

### Auth and session handling

Current auth setup:

- `src/auth.ts` uses NextAuth v5 with JWT sessions
- `src/types/next-auth.d.ts` only adds `session.user.id`
- Session data does not currently expose `isPro`

Important detail for this feature:

- A Stripe webhook will update `users.isPro` in the database
- The client session must pick that change up after checkout
- The prompt already identifies the safest repo-specific fix: always sync `isPro` from the database inside the JWT callback instead of relying on `trigger === "update"`

Recommended auth change:

```ts
callbacks: {
  async jwt({ token, user }) {
    if (user) {
      token.sub = user.id;
    }

    if (token.sub) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { isPro: true },
      });

      token.isPro = dbUser?.isPro ?? false;
    }

    return token;
  },
  session({ session, token }) {
    if (session.user && token.sub) {
      session.user.id = token.sub;
      session.user.isPro = Boolean(token.isPro);
    }

    return session;
  },
}
```

### How user data is accessed today

Current server-side user reads go through:

- `src/lib/db/dashboard-user.ts`
- `auth()` in server actions and route handlers

Current mutation pattern:

- Server actions in `src/actions/*`
- Return shape is `{ success, data?, error? }`
- User ownership is enforced with `auth()` plus DB filtering

Current integration-route pattern:

- `src/app/api/uploads/route.ts`
- `src/app/api/profile/*`
- `src/app/api/auth/*`

This matches Stripe well:

- Use API routes for Stripe checkout, portal, and webhook endpoints
- Keep business checks in small shared billing helpers under `src/lib`

### Existing subscription or payment code

There is no live Stripe code yet.

What already exists:

- Homepage pricing UI in `src/components/homepage/homepage-pricing.tsx`
- Correct public pricing copy for `$8/mo` and `$72/yr`
- Schema fields ready for customer and subscription IDs

What is missing:

- Stripe SDK dependency
- Checkout session creation
- Billing portal session creation
- Webhook endpoint
- Billing UI in Settings
- Free-tier enforcement

## Feature Gating Analysis

### Limits from the product spec

The project spec defines:

- Free: `50 items`
- Free: `3 collections`
- Free: no file or image uploads
- Free: no AI features
- Pro: unlimited items and collections

### Where limits can be enforced now

Item limit:

- `src/actions/items.ts`
- `src/lib/db/items.ts`
- `src/lib/db/items.ts#getDashboardStats` already counts items and can support usage UI

Collection limit:

- `src/actions/collections.ts`
- `src/lib/db/collections.ts`

File and image gating:

- `src/components/layout/sidebar.tsx` already labels Files and Images as `PRO`
- `src/components/dashboard/create-item-dialog.tsx` still lets all signed-in users choose `file` and `image`
- `src/app/api/uploads/route.ts` currently only checks authentication, not plan

Settings and account surface:

- `src/app/settings/page.tsx` currently renders editor preferences and account actions
- This is the best place for a new billing card

### Pro-only features that already exist vs not yet built

Already built and should be gated now:

- File uploads
- Image uploads

Not built yet, so no code gating is needed in this Stripe slice:

- AI features
- Export
- Custom item types

Recommendation:

- Enforce only what exists now
- Keep future Pro checks centralized so later AI/export work can reuse them

## Recommended Integration Shape

### Use API routes for Stripe entry points

Create these API routes:

- `src/app/api/stripe/checkout/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/webhooks/stripe/route.ts`

Why:

- Webhooks require raw-body signature verification
- Checkout and portal flows are third-party integrations
- This matches the existing codebase rule for API routes

### Use a small shared Stripe library

Create:

- `src/lib/billing/stripe.ts`
- `src/lib/billing/guards.ts`

`src/lib/billing/stripe.ts` should own Stripe client creation and env validation.

Example:

```ts
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export const getStripe = () => {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is required.");
  }

  stripeClient = new Stripe(secretKey);

  return stripeClient;
};
```

`src/lib/billing/guards.ts` should own:

- price lookup
- current user billing lookup
- free-tier checks
- webhook-to-user sync helpers

## Files To Create

### `src/lib/billing/stripe.ts`

Purpose:

- Create the Stripe client once
- Validate required Stripe env vars

### `src/lib/billing/guards.ts`

Purpose:

- Define plan constants
- Map `monthly` and `yearly` intervals to Stripe price IDs
- Add helpers like `canCreateItem`, `canCreateCollection`, `canUseFileUploads`

Suggested shape:

```ts
export const FREE_TIER_ITEM_LIMIT = 50;
export const FREE_TIER_COLLECTION_LIMIT = 3;

export const STRIPE_PRICE_IDS = {
  monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  yearly: process.env.STRIPE_PRICE_ID_YEARLY,
} as const;
```

### `src/app/api/stripe/checkout/route.ts`

Purpose:

- Require auth
- Accept `{ interval: "monthly" | "yearly" }`
- Reuse existing Stripe customer when present
- Create customer if missing
- Create a Checkout Session in `subscription` mode
- Return `{ url }`

Recommended request flow:

1. Read session via `auth()`
2. Load user from Prisma
3. Resolve price ID from interval
4. Ensure Stripe customer exists
5. Create checkout session
6. Return session URL

Example:

```ts
const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: stripeCustomerId,
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  success_url: `${baseUrl}/settings?billing=success`,
  cancel_url: `${baseUrl}/settings?billing=cancelled`,
  metadata: {
    userId: user.id,
  },
  subscription_data: {
    metadata: {
      userId: user.id,
    },
  },
});
```

Use metadata on both the Checkout Session and the Subscription. This gives the webhook multiple ways to map Stripe events back to the local user.

### `src/app/api/stripe/portal/route.ts`

Purpose:

- Require auth
- Require `stripeCustomerId`
- Create a billing portal session
- Return `{ url }`

Example:

```ts
const portalSession = await stripe.billingPortal.sessions.create({
  customer: user.stripeCustomerId,
  return_url: `${baseUrl}/settings`,
});
```

### `src/app/api/webhooks/stripe/route.ts`

Purpose:

- Verify Stripe signature with the raw request body
- Handle subscription state changes
- Update `users.isPro`, `stripeCustomerId`, and `stripeSubscriptionId`

Recommended events to handle in v1:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Minimal pattern:

```ts
const rawBody = await request.text();
const signature = request.headers.get("stripe-signature");

const event = stripe.webhooks.constructEvent(
  rawBody,
  signature!,
  process.env.STRIPE_WEBHOOK_SECRET!,
);
```

Recommended sync rule:

- `isPro = true` for subscription states like `active` or `trialing`
- `isPro = false` for canceled, unpaid, incomplete-expired, or missing subscription states

### `src/components/settings/billing-settings.tsx`

Purpose:

- Show current plan status
- Show monthly/yearly upgrade buttons for free users
- Show manage billing button for Pro users
- Show lightweight usage summary

### `src/lib/billing.test.ts`

Purpose:

- Unit-test limit checks and plan-state helpers

### `src/app/api/stripe/checkout/route.test.ts`
### `src/app/api/stripe/portal/route.test.ts`
### `src/app/api/webhooks/stripe/route.test.ts`

Purpose:

- Match the existing repo pattern for route-level tests

## Files To Modify

### `package.json`

Add:

- `stripe`

Optional but useful for local workflow:

- a script for Stripe webhook forwarding if the team wants it later

### `src/auth.ts`

Change:

- Add JWT callback that always reloads `isPro` from Prisma
- Add `isPro` to the session callback

This is the most important session-sync change in the whole plan.

### `src/types/next-auth.d.ts`

Change:

- Add `isPro: boolean` to `Session.user`
- Add JWT typing if you want type-safe callback access

### `src/lib/db/dashboard-user.ts`

Change:

- Include `isPro`
- Optionally include `stripeCustomerId` if the settings UI needs it

### `src/app/settings/page.tsx`

Change:

- Render the new `BillingSettings` section

### `src/actions/items.ts`

Change:

- Block item creation when free users exceed `50 items`
- Block `file` and `image` item creation for free users before any upload or DB write

Recommended error style:

```ts
return {
  success: false,
  error: "Upgrade to Pro to upload files and images.",
};
```

### `src/actions/collections.ts`

Change:

- Block free users from creating more than `3 collections`

### `src/app/api/uploads/route.ts`

Change:

- Add a server-side Pro check before accepting file or image uploads

This must exist even if the dialog hides file/image options, because UI-only gating is not enough.

### `src/components/dashboard/create-item-dialog.tsx`

Change:

- Hide or disable `file` and `image` types for free users
- Show an upgrade message instead of upload controls

### `src/components/layout/sidebar.tsx`

Change:

- Keep the `PRO` badge
- Optionally make the free-user click path send users to Settings billing instead of the item pages

### `src/components/homepage/homepage-pricing.tsx`

Change:

- For signed-in users, point Pro CTA to Settings billing instead of `/dashboard`
- Keep public pricing copy as-is

### `src/app/profile/page.tsx` or `src/components/profile/profile-stats.tsx`

Optional change:

- Show current plan and usage percentage

This is optional for v1. Settings is the required billing surface.

## Stripe Dashboard Setup

Based on current Stripe docs and APIs, set up:

1. Create a Product for `Korax Pro`
2. Create two recurring Prices:
   - monthly price for `$8/month`
   - yearly price for `$72/year`
3. Copy both price IDs into env vars
4. Enable the Billing Portal in Stripe Dashboard
5. Configure the portal return URL to the app settings page
6. Create a webhook endpoint for `/api/webhooks/stripe`
7. Subscribe the webhook to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
8. Copy the webhook signing secret into env vars

Recommended env vars:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_MONTHLY=
STRIPE_PRICE_ID_YEARLY=
STRIPE_PUBLISHABLE_KEY=
```

Notes:

- The publishable key is only needed if you later add client-side Stripe.js flows
- The current plan can work with server-created session URLs and standard redirects

## Webhook Sync Rules

Use the webhook as the source of truth for local plan state.

Recommended DB updates:

- On successful checkout or active subscription:
  - set `isPro = true`
  - store `stripeCustomerId`
  - store `stripeSubscriptionId`
- On canceled or inactive subscription:
  - set `isPro = false`
  - keep Stripe IDs for audit and reactivation flows

Do not grant access only from the checkout redirect query string. Wait for the webhook-backed DB update.

Client behavior after purchase:

- Redirect back to `/settings?billing=success`
- Show a success toast or banner
- A normal page reload should pick up the new session because `auth.ts` will resync `isPro` from Prisma

## Implementation Order

1. Add `stripe` dependency and env placeholders
2. Create `src/lib/billing/stripe.ts` and `src/lib/billing/guards.ts`
3. Add Stripe checkout route
4. Add Stripe billing portal route
5. Add Stripe webhook route
6. Update `src/auth.ts` and `src/types/next-auth.d.ts` for `isPro`
7. Update `src/lib/db/dashboard-user.ts`
8. Add billing UI on Settings
9. Enforce free-tier checks in item creation, collection creation, and uploads
10. Hide or disable Pro-only item types in the create dialog
11. Update homepage signed-in Pro CTA to route into billing
12. Add unit and route tests

## Testing Checklist

### Local setup

1. Add Stripe test keys to `.env`
2. Run the app:

```bash
npm run dev
```

3. Forward Stripe webhooks locally with Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Copy the printed webhook signing secret into `STRIPE_WEBHOOK_SECRET`

### Functional tests

1. Sign in as a free user
2. Try to create a 51st item
   - Success looks like: server action rejects with a free-tier limit message
3. Try to create a 4th collection
   - Success looks like: server action rejects with a free-tier limit message
4. Try to upload a file as free
   - Success looks like: upload route returns a Pro-required error
5. Start monthly checkout
   - Success looks like: Stripe Checkout opens with the monthly price
6. Start yearly checkout
   - Success looks like: Stripe Checkout opens with the yearly price
7. Complete checkout in test mode
   - Success looks like: webhook updates `users.isPro = true`
8. Reload the app
   - Success looks like: session reflects `isPro = true` and Pro-only actions unlock
9. Open billing portal
   - Success looks like: portal session redirects to Stripe billing portal
10. Cancel the subscription in test mode
   - Success looks like: webhook updates `users.isPro = false`

### Repo verification commands

Run after implementation:

```bash
npm run lint
npm run typecheck
npm run test
```

Success looks like:

- `lint` passes with no new errors
- `typecheck` passes with session typing updated for `isPro`
- tests cover billing helpers, Stripe routes, and webhook state transitions

## Risks and tradeoffs

- The session resync fix adds one DB read during JWT validation. That is acceptable for this app size and is the simplest way to keep webhook changes visible after reload.
- Free-tier enforcement must happen on the server, not just in UI components.
- The current schema is enough for v1, but if you later need rich billing UI you may want local fields for subscription status and renewal date.
- AI and export are listed as Pro features in the spec, but they are not implemented yet. Do not add Stripe-driven gating for features that do not exist.

## Minimal done definition

- Free users can start checkout from Settings
- Pro users can open billing portal from Settings
- Stripe webhook updates local `isPro`
- Session reflects webhook changes after reload
- Free-tier item, collection, and upload limits are enforced server-side
- Tests cover the new billing paths
