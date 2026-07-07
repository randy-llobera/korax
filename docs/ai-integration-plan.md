# AI Integration Plan

Verified on April 23, 2026 against official OpenAI and Next.js docs.

## Recommendation

Use the official `openai` Node SDK with `gpt-5-nano` for the first pass of all four AI features:

- Auto-tagging
- AI summaries
- Code explanation
- Prompt optimization

This fits the current stack well because `gpt-5-nano` is positioned by OpenAI as the fastest and lowest-cost GPT-5 model, and it is a strong fit for classification and summarization workloads. Use the Responses API as the default API surface. Keep AI calls server-only.

## Best Fit For This Codebase

Based on the current repo patterns:

- Use Server Actions for short non-streaming AI tasks that return a final result:
  - Auto-tagging
  - AI summaries
  - Prompt optimization
- Use Route Handlers for AI tasks that benefit from streaming or custom HTTP behavior:
  - Code explanation
  - Longer prompt rewrite flows
  - Any feature that needs SSE, custom status codes, or request-scoped rate-limit headers
- Reuse the existing action contract:
  - Validate input with `zod`
  - Read auth state with `auth()`
  - Re-check plan access on the server
  - Return `{ success, data, error }`
- Reuse the existing billing pattern:
  - Gate all AI features behind `session.user.isPro` and a server-side billing check
  - Keep the UI disabled for free users, but treat the server check as authoritative

Relevant local patterns:

- Server Actions: `src/actions/items.ts`, `src/actions/collections.ts`, `src/actions/search.ts`
- Billing and Pro gating: `src/lib/billing/guards.ts`, `src/lib/usage-limits.ts`, `src/lib/db/billing.ts`
- Existing pending/loading UX: `src/components/dashboard/create-item-dialog.tsx`, `src/components/settings/upgrade-page.tsx`
- Existing rate-limit approach: `src/lib/rate-limit.ts`

## SDK Setup

Install and initialize the official SDK once in a server-only module.

Suggested shape:

- Add `openai` dependency
- Create a small server-only helper such as `src/lib/openai.ts`
- Read `OPENAI_API_KEY` only on the server
- Fail fast if the key is missing

Recommended default client usage:

```ts
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

Use the Responses API by default:

```ts
const response = await openai.responses.create({
  model: "gpt-5-nano",
  input: "Summarize this content in 3 bullet points.",
});

const text = response.output_text;
```

## Feature-by-Feature Approach

### 1. Auto-tagging

Use non-streaming Server Actions.

Why:

- Small output
- User expects a quick suggestion set
- Easier to validate and return as structured data

Recommendation:

- Send title, item type, language, URL hostname, and truncated content
- Request a strict JSON result with a short tag list
- Cap the result to 3 to 8 tags
- Show tags as suggestions first, not auto-saved tags

Best output format:

- Structured Outputs with a Zod-backed schema
- Example fields:
  - `tags: string[]`
  - optional `reason?: string`

### 2. AI summaries

Use non-streaming Server Actions first.

Why:

- Summary text is compact
- Fits the current action + toast flow
- Easy to show a preview before save

Recommendation:

- Generate summaries on demand, not automatically at item creation
- Store only when the user accepts
- Keep separate summary prompts by item type:
  - code snippet
  - markdown/note
  - prompt
  - command
  - link metadata text

### 3. Code explanation

Use a Route Handler with streaming.

Why:

- Explanations can be long
- Streaming improves perceived latency
- Route Handlers fit current project guidance for long-running operations and custom response handling

Recommendation:

- Stream explanation text into the drawer or editor area
- Keep explanations ephemeral unless the user explicitly saves them as a note
- For shorter explanations, a non-streaming fallback is still fine

### 4. Prompt optimization

Use two modes:

- Non-streaming Server Action for quick rewrite suggestions
- Streaming Route Handler for larger prompt refactors

Recommendation:

- Return both:
  - optimized prompt
  - short rationale
- Treat this as a suggestion workflow with explicit accept/reject
- Never overwrite the original prompt until the user confirms

## Server Patterns

### Non-streaming pattern

Use a Server Action when:

- Input is small
- Output is short
- You only need a final payload

Recommended flow:

1. Validate user input with `zod`
2. Read session with `auth()`
3. Check `isPro`
4. Optionally fetch billing state for a stronger server-side plan check
5. Apply AI-specific rate limiting
6. Call `openai.responses.create()`
7. Validate output again before returning it to the client
8. Return `{ success, data, error }`

This matches the current action style in the repo.

### Streaming pattern

Use a Route Handler when:

- Output is longer than a small UI payload
- You want token-by-token rendering
- You need custom status codes or headers

Recommended flow:

1. Parse and validate request JSON
2. Authenticate the user
3. Re-check Pro access
4. Apply AI-specific rate limiting
5. Start an OpenAI streaming response
6. Convert stream events to a text stream for the client
7. Return a `Response` with streaming headers

Use Route Handlers inside `app/api/.../route.ts`, which aligns with current Next.js guidance and the repo coding standards.

## Streaming vs Non-Streaming

Default split for Korax:

- Non-streaming:
  - auto-tagging
  - summaries
  - most prompt optimization requests
- Streaming:
  - code explanation
  - larger prompt rewrites

Tradeoff:

- Non-streaming is simpler to test and easier to fit into the existing action result shape
- Streaming feels better for long outputs, but moderation and partial-output UX are harder

Important note from OpenAI guidance:

- Streaming is better for latency perception
- Partial output is harder to moderate than a final complete response

For that reason, start with streaming only where it materially improves UX.

## Error Handling and Rate Limiting

### OpenAI error handling

Catch SDK `APIError` errors and normalize them into user-safe messages.

Recommended mapping:

- `400/422`: bad request or invalid prompt shape
- `401`: server misconfiguration or invalid key
- `429`: rate limited
- `500+`: upstream temporary failure

Log internally:

- OpenAI request ID
- status code
- feature name
- user ID
- token usage if present

Do not expose raw upstream errors to the client.

### App-side rate limiting

Reuse the pattern in `src/lib/rate-limit.ts`, but create AI-specific limit buckets.

Recommended keys:

- per user ID for signed-in Pro features
- optionally per IP plus user ID for abuse resistance

Suggested AI buckets:

- auto-tagging: higher limit
- summaries: medium limit
- code explanation: lower limit
- prompt optimization: medium limit

Recommended behavior:

- return friendly retry messaging
- fail closed in production if rate-limit infrastructure is required and unavailable
- keep limits separate from auth rate limits

## Pro Gating Pattern

Keep the same two-layer model already used elsewhere:

- Client:
  - disable AI entry points for free users
  - show Upgrade CTA
- Server:
  - reject all AI requests unless the user is Pro

Best fit for current code:

- Reuse `session.user.isPro`
- Reuse billing helpers where stronger server checks are needed
- Reuse the existing `/upgrade` flow and current upgrade messaging style

Do not trust hidden buttons or client-only checks.

## Cost Optimization

`gpt-5-nano` is the right default cost-control choice for these features.

Recommended cost controls:

- Use `gpt-5-nano` for all four launch features
- Truncate long item content before sending it to the model
- Send only the fields needed for each task
- Prefer Structured Outputs for tagging and other bounded outputs to reduce retries
- Put reusable instructions first in prompts to benefit from prompt caching
- Keep user-specific content at the end of prompts
- Log token usage per feature
- Add per-feature output caps
- Use Batch API later for offline enrichment jobs if you add background summary/tag generation

Practical examples:

- Auto-tagging should only send title, item type, language, and a content excerpt
- Summaries should cap source text length and cap summary length
- Code explanation should limit file size or selected-code size
- Prompt optimization should avoid sending large unrelated item metadata

## UI Patterns

Match existing app behavior instead of adding a new UX pattern.

Recommended UI behavior:

- Use `useTransition` or explicit submitting state for non-streaming actions
- Disable submit buttons while pending
- Show `sonner` toast errors for failures
- Show suggestions inline before saving
- Add clear `Accept` and `Discard` actions for generated content
- Preserve the user’s original content until confirmation

Feature-specific suggestions:

- Auto-tagging:
  - `Suggest tags` button
  - render removable tag chips before save
- Summary:
  - `Generate summary` button
  - preview card with `Insert` and `Dismiss`
- Code explanation:
  - stream into a read-only panel inside the drawer
  - support cancel/retry
- Prompt optimization:
  - side-by-side original vs optimized text
  - one-click replace only after user confirmation

## Security

### API key handling

- Keep `OPENAI_API_KEY` server-only
- Never expose it to client components
- Never proxy arbitrary user prompts directly from the browser to OpenAI

### Authorization

- Treat every AI action and route handler as a public-facing endpoint
- Re-check session and Pro status server-side every time

### Input handling

- Validate all inputs with `zod`
- Bound input size before sending to OpenAI
- Strip or reject obviously invalid URLs or unexpected file payloads
- Prefer structured output schemas over free-form parsing

### Data handling

- Do not log raw sensitive item content in production logs
- Log metadata, request IDs, status codes, and token usage instead
- If you later support files as AI inputs, only allow files already owned by the authenticated user

### Prompt safety

- Keep system/developer instructions fixed on the server
- Treat item content as untrusted input
- Do not let user content override system instructions

## Suggested Rollout

### Phase 1

- Add OpenAI SDK
- Add server-only OpenAI client helper
- Add AI-specific rate-limit helper
- Implement non-streaming auto-tagging
- Implement non-streaming summaries

### Phase 2

- Implement streaming code explanation route
- Implement prompt optimizer suggestion flow
- Add token usage logging

### Phase 3

- Add Structured Outputs for all bounded-response features
- Add analytics for acceptance rate and retry rate
- Add optional background or batch enrichment flows if needed

## Minimal Implementation Shape

If implemented with the current project conventions, the likely shape is:

- `src/lib/openai.ts`
- `src/actions/ai.ts` for non-streaming actions
- `src/app/api/ai/explain/route.ts` for streaming code explanation
- `src/app/api/ai/optimize/route.ts` only if prompt optimization needs streaming
- existing client components extended with suggestion panels and accept/reject controls

This keeps the architecture incremental and avoids introducing a separate AI subsystem too early.

## Source Links

- OpenAI model reference for `gpt-5-nano`: https://platform.openai.com/docs/models/gpt-5-nano/
- OpenAI Node SDK: https://github.com/openai/openai-node
- OpenAI streaming guide: https://platform.openai.com/docs/guides/streaming-responses
- OpenAI structured outputs guide: https://platform.openai.com/docs/guides/structured-outputs
- OpenAI prompt caching guide: https://platform.openai.com/docs/guides/prompt-caching
- OpenAI cost optimization guide: https://platform.openai.com/docs/guides/cost-optimization
- OpenAI Batch API guide: https://platform.openai.com/docs/guides/batch
- OpenAI rate limits guide: https://platform.openai.com/docs/guides/rate-limits
- Next.js 16 Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware
- Next.js 16 auth and server action guidance: https://nextjs.org/docs/app/guides/authentication
