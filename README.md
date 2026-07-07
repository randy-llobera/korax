# Korax

Developer knowledge hub for snippets, prompts, commands, notes, files, images, and links.

## Stack

- Next.js 16 App Router
- TypeScript
- Prisma with Neon Postgres
- NextAuth v5
- Tailwind CSS v4
- shadcn/ui
- Vitest

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env files as needed:

- `.env` for local development
- `.env.production` for production values
- `.env.example` as the variable reference

3. Generate Prisma client if needed:

```bash
npm run prisma:generate
```

4. Start the dev server:

```bash
npm run dev
```

## Project Context

- [Project overview](./context/project-overview.md)
- [Coding standards](./context/coding-standards.md)
- [AI interaction](./context/ai-interaction.md)
- [Current feature](./context/current-feature.md)
