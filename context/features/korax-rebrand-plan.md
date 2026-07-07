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

## Phase 3: New Repository And Git History

Goal: create a clean Korax repository with no old project history.

Approach:

1. Create a new private GitHub repository named korax.
2. Copy the rebranded working tree into a clean directory.
3. Exclude:
   - .env
   - .env.production
   - .next
   - node_modules
   - local logs/cache files

4. Initialize fresh git history.
5. Commit the rebranded app as the initial commit.
6. Connect the new repo to the new Vercel project.

Risks:

- Accidentally committing local env files would leak credentials.
- New repo loses previous issue/PR history, which is intended here.

Done checklist:

- Fresh repo exists.
- First commit contains only safe tracked files.
- No secret files are committed.
- New remote points to the Korax repo.

## Phase 4: Deployment And Smoke Testing

Goal: deploy Korax and verify core workflows.

Approach:

1. Deploy to the new Vercel project.
2. Run production migration/seed only against the intended Korax database.
3. Verify:
   - Homepage loads.
   - Register/sign in works.
   - Email verification works if enabled.
   - GitHub OAuth works.
   - Dashboard loads.
   - Create/edit/delete item works.
   - Collections work.
   - Search works.
   - File/image upload and download work.
   - Stripe checkout, portal, and webhook work.
   - AI actions work for Pro users.

4. Confirm old deployment is not linked from new public surfaces.

Risks:

- Provider callback mismatch can break auth or billing.
- Missing env vars may only surface at runtime.
- Stripe webhooks require exact endpoint configuration.

Done checklist:

- New deployment is live.
- Core workflows pass manually.
- Build, lint, typecheck, and tests pass locally.
- Provider dashboards show Korax naming.

## Phase 5: Post-Launch Cleanup And Later UI Rebrand

Goal: finish ownership work after the name and deployment are stable.

Approach:

1. Decide whether to archive or delete the old repo/deployment.
2. Remove old Vercel project if no longer needed.
3. Decommission old provider resources after confirming no data is needed.
4. Plan a deeper UI pass:
   - Homepage art direction
   - Logo refinement
   - App icon/favicon
   - Open Graph image
   - Color/token refinement
   - Dashboard polish only where it improves usability

5. Optional domain/email polish:
   - Buy or configure Korax domain.
   - Add branded transactional email sender.
   - Update demo email to final domain.

Risks:

- Deleting old services too early can lose data or files.
- UI redesign should not block the rebrand launch.

Done checklist:

- Old public surfaces are retired or hidden.
- Korax has stable domain/deployment/provider setup.
- Later visual rebrand has a separate scoped plan.
