# OpenGenerator

> Schema-to-API code generator - CRUD, auth, validation, docs, deployment - all ready

[![npm version](https://badge.fury.io/js/opengenerator.svg)](https://www.npmjs.com/package/opengenerator)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

OpenGenerator transforms any schema (OpenAPI, Prisma, Zod, JSON Schema, TypeBox, @oxog/vld) into a complete, production-ready API with:

- **Multiple API styles**: REST, GraphQL, tRPC
- **Multiple frameworks**: Express, Fastify, Hono, Koa, Standalone
- **Multiple auth strategies**: JWT, OAuth, Session, API Keys, Magic Link, Passkeys
- **Multiple database adapters**: Prisma, Drizzle, Kysely, TypeORM, Mongoose, Raw SQL
- **Multiple deployment targets**: Docker, Vercel, Railway, Fly.io, AWS Lambda, Kubernetes

**Philosophy**: One schema, infinite possibilities. Zero boilerplate, full control.

## Quick Start

```bash
# Install
npm install opengenerator

# Initialize new project
npx opengenerator init

# Generate code
npx opengenerator generate
```

## Programmatic Usage

```typescript
import { OpenGenerator } from '@opengenerator/core'
import { prismaParser } from '@opengenerator/parser-prisma'
import { restGenerator } from '@opengenerator/gen-rest'
import { fastifyAdapter } from '@opengenerator/adapter-fastify'
import { jwtAuth } from '@opengenerator/auth-jwt'
import { prismaDb } from '@opengenerator/db-prisma'
import { dockerDeploy } from '@opengenerator/deploy-docker'

const generator = new OpenGenerator()
  .parser(prismaParser())
  .generator(restGenerator())
  .adapter(fastifyAdapter())
  .auth(jwtAuth())
  .database(prismaDb())
  .deploy(dockerDeploy())

await generator.generate({
  schema: './prisma/schema.prisma',
  output: './generated',
})
```

## Configuration

Create an `opengenerator.config.ts` file:

```typescript
import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './generated',

  api: {
    rest: {
      enabled: true,
      prefix: '/api/v1',
    },
    graphql: {
      enabled: true,
      path: '/graphql',
    },
  },

  adapter: 'fastify',

  auth: {
    strategies: ['jwt', 'oauth'],
    jwt: {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    },
    oauth: {
      providers: ['google', 'github'],
    },
  },

  database: {
    adapter: 'prisma',
  },

  deploy: ['docker', 'vercel'],

  features: {
    swagger: true,
    cors: true,
    rateLimit: true,
    logging: true,
    validation: true,
    healthCheck: true,
  },
})
```

## Packages

### Core

| Package | Description |
|---------|-------------|
| [`@opengenerator/core`](./packages/core) | Core engine and plugin system |
| [`@opengenerator/cli`](./packages/cli) | Command-line interface |
| [`opengenerator`](./packages/opengenerator) | Meta package (installs all) |

### Parsers

| Package | Description |
|---------|-------------|
| [`@opengenerator/parser-openapi`](./packages/parsers/openapi) | OpenAPI 3.0/3.1 parser |
| [`@opengenerator/parser-prisma`](./packages/parsers/prisma) | Prisma schema parser |
| [`@opengenerator/parser-json-schema`](./packages/parsers/json-schema) | JSON Schema parser |
| [`@opengenerator/parser-zod`](./packages/parsers/zod) | Zod schema parser |
| [`@opengenerator/parser-typebox`](./packages/parsers/typebox) | TypeBox schema parser |
| [`@opengenerator/parser-vld`](./packages/parsers/vld) | @oxog/vld schema parser |

### Generators

| Package | Description |
|---------|-------------|
| [`@opengenerator/gen-rest`](./packages/generators/rest) | REST API generator |
| [`@opengenerator/gen-graphql`](./packages/generators/graphql) | GraphQL API generator |
| [`@opengenerator/gen-trpc`](./packages/generators/trpc) | tRPC API generator |

### Adapters

| Package | Description |
|---------|-------------|
| [`@opengenerator/adapter-express`](./packages/adapters/express) | Express.js adapter |
| [`@opengenerator/adapter-fastify`](./packages/adapters/fastify) | Fastify adapter |
| [`@opengenerator/adapter-hono`](./packages/adapters/hono) | Hono adapter |
| [`@opengenerator/adapter-koa`](./packages/adapters/koa) | Koa adapter |
| [`@opengenerator/adapter-standalone`](./packages/adapters/standalone) | Node.js native HTTP adapter |

### Auth

| Package | Description |
|---------|-------------|
| [`@opengenerator/auth-jwt`](./packages/auth/jwt) | JWT authentication |
| [`@opengenerator/auth-oauth`](./packages/auth/oauth) | OAuth2 authentication |
| [`@opengenerator/auth-session`](./packages/auth/session) | Session-based authentication |
| [`@opengenerator/auth-apikey`](./packages/auth/apikey) | API key authentication |
| [`@opengenerator/auth-magic-link`](./packages/auth/magic-link) | Magic link authentication |
| [`@opengenerator/auth-passkey`](./packages/auth/passkey) | WebAuthn/FIDO2 passkeys |

### Database

| Package | Description |
|---------|-------------|
| [`@opengenerator/db-prisma`](./packages/database/prisma) | Prisma adapter |
| [`@opengenerator/db-drizzle`](./packages/database/drizzle) | Drizzle adapter |
| [`@opengenerator/db-kysely`](./packages/database/kysely) | Kysely adapter |
| [`@opengenerator/db-typeorm`](./packages/database/typeorm) | TypeORM adapter |
| [`@opengenerator/db-mongoose`](./packages/database/mongoose) | Mongoose adapter |
| [`@opengenerator/db-raw-sql`](./packages/database/raw-sql) | Raw SQL adapter |

### Deploy

| Package | Description |
|---------|-------------|
| [`@opengenerator/deploy-docker`](./packages/deploy/docker) | Docker + docker-compose |
| [`@opengenerator/deploy-vercel`](./packages/deploy/vercel) | Vercel serverless |
| [`@opengenerator/deploy-railway`](./packages/deploy/railway) | Railway deployment |
| [`@opengenerator/deploy-fly`](./packages/deploy/fly) | Fly.io deployment |
| [`@opengenerator/deploy-lambda`](./packages/deploy/lambda) | AWS Lambda + SAM/CDK |
| [`@opengenerator/deploy-kubernetes`](./packages/deploy/kubernetes) | Kubernetes + Helm |

### Presets

| Package | Description |
|---------|-------------|
| [`@opengenerator/preset-fullstack-prisma`](./packages/presets/fullstack-prisma) | Full stack with Prisma |
| [`@opengenerator/preset-serverless-drizzle`](./packages/presets/serverless-drizzle) | Serverless with Drizzle |
| [`@opengenerator/preset-graphql-apollo`](./packages/presets/graphql-apollo) | GraphQL with Apollo |
| [`@opengenerator/preset-minimal-rest`](./packages/presets/minimal-rest) | Minimal REST API |
| [`@opengenerator/preset-enterprise`](./packages/presets/enterprise) | Enterprise features |

## CLI Commands

```bash
# Initialize new project
opengenerator init
opengenerator init --preset fullstack-prisma
opengenerator init --interactive

# Generate code
opengenerator generate
opengenerator generate --config ./custom-config.ts
opengenerator generate --schema ./schema.prisma --output ./api

# Watch mode
opengenerator watch
opengenerator watch --debounce 1000

# Validate schema
opengenerator validate
opengenerator validate --schema ./schema.prisma

# Show project info
opengenerator info
opengenerator info --plugins
```

## Examples

- [Basic CRUD](./examples/basic-crud) - Simple CRUD API
- [Multi-tenant SaaS](./examples/multi-tenant-saas) - Multi-tenant architecture
- [Real-time Chat](./examples/realtime-chat) - WebSocket subscriptions
- [E-commerce](./examples/e-commerce) - E-commerce API
- [Microservices](./examples/microservices) - Microservices architecture

## Documentation

Visit [opengenerator.dev](https://opengenerator.dev) for full documentation.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT - see [LICENSE](./LICENSE) for details.

## Author

Ersin KOC - [@ersinkoc](https://github.com/ersinkoc)
