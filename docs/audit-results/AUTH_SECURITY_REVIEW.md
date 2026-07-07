# Auth Security Review

Date: 2026-04-14

Scope:
- `src/auth.ts`
- `src/proxy.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/verification/resend/route.ts`
- `src/app/api/auth/password/forgot/route.ts`
- `src/app/api/auth/password/reset/route.ts`
- `src/app/verify-email/route.ts`
- `src/app/api/profile/password/route.ts`
- `src/app/api/profile/delete/route.ts`
- `src/lib/auth/email-verification.ts`
- auth-related client entry points for sign-in and reset UX

Out of scope:
- NextAuth/Auth.js built-in CSRF, cookie, OAuth, and adapter protections except where custom code changes their security posture

## Summary

I did not find a direct custom authorization bypass that lets one signed-in user act on another user's data. The inspected profile mutations scope writes to `session.user.id`, and the dashboard/profile data loaders derive queries from the authenticated user.

The main risks are around session lifecycle, token flow separation, origin trust for emailed auth links, and missing abuse controls on custom auth endpoints.

## Findings

### 1. High: Password recovery and password changes do not invalidate active JWT sessions

Files:
- `src/auth.ts:53-65`
- `src/app/api/auth/password/reset/route.ts:109-120`
- `src/app/api/profile/password/route.ts:96-113`
- `src/app/api/profile/delete/route.ts:43-62`
- `src/proxy.ts:7-15`

What I found:
- The app uses `session.strategy = "jwt"` in `src/auth.ts:55-57`.
- Password reset updates the stored password and deletes reset tokens, but it does not revoke existing sessions in `src/app/api/auth/password/reset/route.ts:109-120`.
- Password change has the same issue in `src/app/api/profile/password/route.ts:96-113`.
- Account deletion removes the user row, but it does not invalidate the caller's JWT before returning success in `src/app/api/profile/delete/route.ts:43-62`.
- Middleware grants access based on `request.auth` alone in `src/proxy.ts:7-15`; it does not re-check that the backing user still exists.

Why it matters:
- If an attacker steals a valid session cookie, the victim resetting or changing their password does not evict that attacker.
- Account recovery is weaker than it appears because the compromised session remains usable until JWT expiry.
- After account deletion, stale JWTs can still satisfy edge auth checks until expiry. Some server-side reads will fail safely later, but the auth boundary itself is stale.

Recommendation:
- Add server-enforced session revocation for credential changes and account deletion.
- A common pattern is a `sessionVersion` or `tokenVersion` on `User`, copied into the JWT and checked in `jwt` or `session` callbacks on every request.
- Increment that version on password reset, password change, and account deletion.
- If immediate server-side invalidation is a hard requirement, consider database-backed sessions instead of long-lived JWT-only sessions.

### 2. Medium: Verification and reset tokens can be consumed by the wrong endpoint

Files:
- `src/app/verify-email/route.ts:20-52`
- `src/app/api/auth/password/reset/route.ts:54-118`
- `src/lib/auth/email-verification.ts:117-205`

What I found:
- Email verification and password reset both store hashed tokens in the shared `VerificationToken` table.
- The verification route looks up tokens only by hashed `token` in `src/app/verify-email/route.ts:20-23`, then assumes `identifier` is a user email in `src/app/verify-email/route.ts:35-52`.
- The reset route also looks up tokens only by hashed `token` in `src/app/api/auth/password/reset/route.ts:54-57`, then later checks whether the identifier starts with `password-reset:` in `src/app/api/auth/password/reset/route.ts:77-88`.
- On mismatch, both routes delete tokens anyway.

Why it matters:
- A valid reset token sent to the verification route, or a verification token sent to the reset route, can be invalidated without completing the intended flow.
- This is not an account-takeover bug by itself, but it weakens recovery and verification reliability and makes token handling brittle.

Recommendation:
- Treat token type as part of validation, not a best-effort check after lookup.
- Verification should only accept identifiers in the verification format.
- Reset should only accept identifiers prefixed with `password-reset:`.
- Reject mismatches without deleting the token.
- Longer term, split token types explicitly with a dedicated column or separate tables.

### 3. Medium: Auth emails build token-bearing links from the inbound request origin

Files:
- `src/app/api/auth/register/route.ts:99-103`
- `src/app/api/auth/password/forgot/route.ts:46-50`
- `src/app/api/auth/verification/resend/route.ts:52-56`
- `src/lib/auth/email-verification.ts:58-80`

What I found:
- Registration, forgot-password, and resend-verification all pass `new URL(request.url).origin` into the email helpers.
- The email helpers then generate live verification and reset links from that origin.

Why it matters:
- If the deployment path ever trusts attacker-controlled `Host` or forwarded-host headers, reset and verification emails can be generated with a hostile origin.
- That turns the emailed link into a token exfiltration path because the live token is embedded in the URL query string.
- This is especially important in reverse-proxy and preview-deployment setups where host normalization is easy to get wrong.

Recommendation:
- Build auth URLs from a pinned application origin from configuration, not from `request.url`.
- Reject startup if the canonical app URL is missing.
- Keep using random, hashed tokens, but do not let the request host choose where those tokens are sent.

### 4. Medium: Custom auth endpoints have no visible rate limiting or abuse throttling

Files:
- `src/auth.ts:15-42`
- `src/app/api/auth/register/route.ts:23-114`
- `src/app/api/auth/verification/resend/route.ts:15-62`
- `src/app/api/auth/password/forgot/route.ts:14-56`
- `src/app/api/auth/password/reset/route.ts:16-120`
- `src/app/api/profile/password/route.ts:17-113`

What I found:
- The credentials authorize path does a straight user lookup and bcrypt compare with no per-IP or per-account throttling in `src/auth.ts:15-42`.
- The custom register, forgot-password, resend-verification, reset-password, and change-password endpoints also show no rate limiting, cooldowns, or lockout logic.

Why it matters:
- Credentials sign-in becomes easier to brute force if perimeter controls are absent or misconfigured.
- Forgot-password and resend-verification can be abused for email flooding.
- Password change can be hammered with repeated current-password guesses against a live session.

Recommendation:
- Add rate limits keyed by IP and normalized email for auth endpoints.
- Apply stricter limits to credentials sign-in and password-change attempts.
- Add resend cooldowns and reset-request throttles.
- If infra already enforces this at the edge, document it in-repo so the app does not silently depend on an external assumption.

## Lower-risk observations

### 5. Low: Registration can create a user before verification email delivery succeeds

Files:
- `src/app/api/auth/register/route.ts:86-112`
- `src/lib/auth/email-verification.ts:151-157`

What I found:
- User creation happens before the verification email is sent.
- If email sending throws, the route returns `500`, but the account record has already been created.

Why it matters:
- This is mainly an availability and support issue, not a direct security break.
- It can strand unverified accounts and force operators or users into resend/recovery flows.

Recommendation:
- Either wrap creation plus token issuance in a compensating flow, or return a more specific result that reflects partial success and guides the user into resend verification.

## No-finding notes

- I did not find an obvious horizontal privilege escalation in the inspected custom routes. Profile mutations are tied to `session.user.id` rather than caller-supplied identifiers.
- Passwords are hashed with bcrypt before storage.
- Verification and reset tokens are hashed before storage, which is the right baseline for token-at-rest handling.
- I did not find hardcoded live credentials or secrets in the repository contents I inspected. `.env.example` contains placeholders only.

## Priority order

1. Invalidate active sessions on password reset, password change, and account deletion.
2. Pin emailed auth links to a configured canonical origin.
3. Fix cross-flow token consumption by validating token type before mutation or deletion.
4. Add rate limiting and abuse controls to the custom auth surface.
