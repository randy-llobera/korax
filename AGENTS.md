# Korax

A developer knowledge hub for snippets, prompts, commands, notes, files, images, links and custom item types.

## Context Files

Read these for full project context:

- @context/project-overview.md: Features, data models, tech stack, UI/UX
- @context/coding-standards.md: Code conventions and patterns
- @context/ai-interaction.md : Workflow and communication guidelines
- @context/current-feature.md: What we are currently working on

## Tech Stack

- Next.js 16 (App Router, Server Components)
- TypeScript (strict)
- Prisma + Neon PostgreSQL
- NextAuth v5 (Email + GitHub)
- Tailwind CSS v4 + shadcn/ui
- Cloudflare R2 (file storage)
- OpenAI gpt-5-nano
- Stripe (payments)

## Quick Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run lint     # Run ESLint
```

## Neon MCP Defaults

- Default Neon project: current development project (`fancy-sound-03830381`)
- Default Neon branch: current development branch (`br-twilight-lake-amzju9vx`)
- When using any Neon MCP tool, always use this project and branch unless I
  explicitly say otherwise.
- Treat `production` (`br-proud-violet-am3tppgg`) as read-only by default.
- Never run write operations against `production` unless I explicitly name
  `production` and clearly ask for that change.
- If a Neon MCP tool supports `branchId`, always pass `br-twilight-lake-amzju9vx`
  unless I explicitly override it.
- If a Neon MCP tool supports `projectId`, always pass `fancy-sound-03830381`
  unless I explicitly override it.
- If a request is ambiguous, assume the current development branch, not `production`.
- Before any destructive or write action in Neon, state which project and branch
  you are about to use.
