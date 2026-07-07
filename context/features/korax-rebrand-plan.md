# Korax Complete Rebrand Plan

## Summary

Rebrand the app to Korax in phases. Phase 1 is a name-only change with no intentional UI redesign. Later phases cover brand system, marketing page refresh, provider/service migration, new repository/history, deployment, and launch cleanup.

## Phase 1: Name-Only Code Rebrand

Goal: remove the old app name from tracked code and visible product surfaces while keeping the current UI mostly unchanged.

Files to change:

- package.json
- package-lock.json
- .env.example
- README.md
- AGENTS.md
- src/app/layout.tsx
- src/app/page.tsx
- src/app/(auth)/\*/page.tsx
- src/components/homepage/\*
- src/components/layout/top-bar.tsx
- src/lib/auth/email-verification.ts
- src/lib/auth/email-verification.test.ts
- src/lib/billing/stripe.ts
- src/lib/rate-limit.ts
- prisma/seed.ts
- scripts/test-db.ts
- scripts/delete-non-demo-users.ts
- context/\*_/_.md
- docs/\*_/_.md
- prototypes/homepage/index.html

Approach:

1. Replace user-facing product name with Korax.
2. Replace package/internal lowercase identifiers with korax.
3. Update metadata title/description.
4. Update auth page copy, auth email subjects/body text, footer, homepage logo, dashboard top-bar logo text, Stripe app info, rate-limit prefixes, demo email,
   and docs.

5. Keep the existing UI, colors, layout, dashboard structure, pricing, and feature set unchanged.
6. Add only minimal Korax positioning copy where useful: “A climbing harness carries the essentials so you can focus on the climb. Korax keeps your developer
   knowledge within reach.”

Risks:

- Broad text replacement can accidentally rewrite historical docs awkwardly.
- Changing Redis prefixes resets rate-limit history.
- Demo email changes affect seed/test expectations.

Done checklist:

- Legacy product-name scan returns no tracked app references.
- npm run typecheck passes.
- npm run lint passes.
- npm run test passes.
- npm run build passes.

## Phase 2: External Providers And Secrets

Goal: remove old-name attachment from external services and rotate exposed/local credentials before public launch.

Providers to review:

- GitHub
- Vercel
- Neon
- GitHub OAuth
- Resend
- Upstash Redis
- Cloudflare R2
- Stripe
- OpenAI
- Domain/DNS provider

Approach:

1. Create or rename public/admin resources:
   - GitHub repo: korax
   - Vercel project: korax
   - Neon project/branch: korax, korax-dev
   - GitHub OAuth app: Korax
   - Resend sender/domain: Korax-owned domain
   - Upstash database: Korax naming
   - R2 bucket: korax-files or equivalent
   - Stripe product: Korax Pro

2. Rotate secrets currently present in local env files before creating the new repo.
3. Create clean environment variables in Vercel.
4. Update callback URLs:
   - Auth.js base URL
   - GitHub OAuth callback
   - Stripe webhook URL
   - Resend/domain settings if applicable

5. Keep production Neon read-only unless explicitly migrating production data.

Risks:

- OAuth, Stripe, and webhook URLs are easy to miss.
- R2 bucket migration may require copying existing uploaded files.
- Changing Stripe product/prices can affect existing subscriptions if real users exist.

Done checklist:

- No old-name provider resource is public-facing.
- All secrets are rotated or recreated.
- New env vars exist in Vercel.
- Auth, email, upload, billing, AI, and webhooks work against Korax services.

## Phase 3: Fresh Database Baseline

Goal: reset development and production databases after launch prep so both start from the same seeded Korax demo baseline.

Approach:

1. Verify Prisma migrations are current on both development and production.
2. Add a guarded database data reset script that dry-runs by default and only deletes data with an explicit execute flag.
3. Standardize the reset workflow:
   - `npm run db:reset:data -- --execute`
   - `npm run db:seed`
   - `npm run db:test`

4. Keep `npm run db:seed` as the default full seed path that creates `demo@korax.dev`, system item types, demo collections, and demo items.
5. Verify development and production have matching counts and seeded item types after reset and seed.

Risks:

- Reset deletes all users, auth records, items, collections, tags, and item types except Prisma migration history.
- File objects in external storage are not deleted by the database reset script.
- Production reset must only be run after explicitly confirming the intended Neon project and branch.

Done checklist:

- Development and production migrations are up to date.
- Development and production contain the same seeded demo baseline.
- `npm run db:seed` creates the demo user and useful demo data by default.
- `npm run db:test` verifies the expected demo user, system item types, and baseline counts.
