# OpenGenerator

> Schema-to-API Code Generator - Transform your schemas into production-ready APIs

## Installation

```bash
npm install opengenerator
# or
pnpm add opengenerator
# or
npx opengenerator
```

## Quick Start

```bash
# Initialize a new project
npx opengenerator init

# Generate code
npx opengenerator generate

# Watch for changes
npx opengenerator watch
```

## Configuration

Create an `opengenerator.config.ts` file:

```typescript
import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './generated',

  api: {
    rest: { enabled: true, prefix: '/api/v1' },
    graphql: { enabled: true },
  },

  adapter: 'fastify',

  auth: {
    strategies: ['jwt'],
  },

  database: {
    adapter: 'prisma',
  },

  deploy: ['docker'],
})
```

## Presets

- `fullstack-prisma` - Prisma + REST + GraphQL + Fastify + JWT + Docker
- `serverless-drizzle` - Drizzle + REST + Hono + JWT + Vercel
- `graphql-apollo` - Prisma + GraphQL + Apollo Server + OAuth
- `minimal-rest` - JSON Schema + REST + Standalone + API Key
- `enterprise` - All features enabled

## Packages

### Parsers
- `@opengenerator/parser-prisma`
- `@opengenerator/parser-openapi`
- `@opengenerator/parser-json-schema`
- `@opengenerator/parser-zod`
- `@opengenerator/parser-typebox`
- `@opengenerator/parser-vld`

### Generators
- `@opengenerator/gen-rest`
- `@opengenerator/gen-graphql`
- `@opengenerator/gen-trpc`

### Adapters
- `@opengenerator/adapter-express`
- `@opengenerator/adapter-fastify`
- `@opengenerator/adapter-hono`
- `@opengenerator/adapter-koa`
- `@opengenerator/adapter-standalone`

### Auth
- `@opengenerator/auth-jwt`
- `@opengenerator/auth-oauth`
- `@opengenerator/auth-session`
- `@opengenerator/auth-apikey`
- `@opengenerator/auth-magic-link`
- `@opengenerator/auth-passkey`

### Database
- `@opengenerator/db-prisma`
- `@opengenerator/db-drizzle`
- `@opengenerator/db-kysely`
- `@opengenerator/db-typeorm`
- `@opengenerator/db-mongoose`
- `@opengenerator/db-raw-sql`

### Deploy
- `@opengenerator/deploy-docker`
- `@opengenerator/deploy-vercel`
- `@opengenerator/deploy-railway`
- `@opengenerator/deploy-fly`
- `@opengenerator/deploy-lambda`
- `@opengenerator/deploy-kubernetes`

## License

MIT - see [LICENSE](./LICENSE) for details.
