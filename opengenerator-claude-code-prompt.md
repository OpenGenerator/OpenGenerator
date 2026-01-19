# OpenGenerator - Claude Code Single-Shot Prompt

## Project Identity

| Field | Value |
|-------|-------|
| Name | OpenGenerator |
| Package Scope | `@opengenerator/*` |
| Main Package | `opengenerator` (meta package) |
| GitHub | `github.com/opengenerator/opengenerator` |
| Domain | `opengenerator.dev` |
| Author | Ersin KOÇ |
| License | MIT |
| Description | Schema-to-API code generator - CRUD, auth, validation, docs, deployment - all ready |

---

## Mission Statement

OpenGenerator transforms any schema (OpenAPI, Prisma, Zod, JSON Schema, TypeBox, @oxog/vld) into a complete, production-ready API with:
- Multiple API styles (REST, GraphQL, tRPC)
- Multiple frameworks (Express, Fastify, Hono, Koa, Standalone)
- Multiple auth strategies (JWT, OAuth, Session, API Keys, Magic Link, Passkeys)
- Multiple database adapters (Prisma, Drizzle, Kysely, TypeORM, Mongoose, Raw SQL)
- Multiple deployment targets (Docker, Vercel, Railway, Fly.io, AWS Lambda, Kubernetes)

**Philosophy**: One schema, infinite possibilities. Zero boilerplate, full control.

---

## Monorepo Structure

```
opengenerator/
├── package.json                 # Workspace root (pnpm)
├── pnpm-workspace.yaml
├── turbo.json                   # Turborepo config
├── tsconfig.base.json           # Shared TypeScript config
├── vitest.workspace.ts          # Shared test config
├── .github/
│   └── workflows/
│       ├── ci.yml               # Test + lint on PR
│       ├── publish.yml          # NPM publish on tag
│       └── deploy-docs.yml      # Deploy opengenerator.dev
│
├── packages/
│   │
│   ├── core/                    # @opengenerator/core
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsup.config.ts
│   │   ├── vitest.config.ts
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── generator.ts     # Main OpenGenerator class
│   │   │   ├── pipeline.ts      # Generation pipeline engine
│   │   │   ├── schema.ts        # Universal schema IR (Intermediate Representation)
│   │   │   ├── emitter.ts       # Code emitter base
│   │   │   ├── template.ts      # Template engine
│   │   │   ├── plugins.ts       # Plugin system
│   │   │   ├── config.ts        # Config loader & validator
│   │   │   ├── watcher.ts       # File watcher for incremental builds
│   │   │   └── types/
│   │   │       ├── index.ts
│   │   │       ├── schema.ts    # IR type definitions
│   │   │       ├── parser.ts    # Parser plugin interface
│   │   │       ├── generator.ts # Generator plugin interface
│   │   │       ├── adapter.ts   # Adapter plugin interface
│   │   │       ├── auth.ts      # Auth plugin interface
│   │   │       ├── database.ts  # Database plugin interface
│   │   │       └── deploy.ts    # Deploy plugin interface
│   │   ├── tests/
│   │   │   ├── generator.test.ts
│   │   │   ├── pipeline.test.ts
│   │   │   ├── schema.test.ts
│   │   │   └── plugins.test.ts
│   │   ├── README.md
│   │   └── llms.txt
│   │
│   ├── cli/                     # @opengenerator/cli
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts         # CLI entry point
│   │   │   ├── commands/
│   │   │   │   ├── init.ts      # opengenerator init
│   │   │   │   ├── generate.ts  # opengenerator generate
│   │   │   │   ├── watch.ts     # opengenerator watch
│   │   │   │   ├── validate.ts  # opengenerator validate
│   │   │   │   └── info.ts      # opengenerator info
│   │   │   ├── wizard/
│   │   │   │   ├── index.ts     # Interactive wizard
│   │   │   │   ├── prompts.ts   # Prompt definitions
│   │   │   │   └── presets.ts   # Preset selection
│   │   │   └── utils/
│   │   │       ├── logger.ts    # Colored output
│   │   │       ├── spinner.ts   # Progress indicator
│   │   │       └── config.ts    # Config file handling
│   │   ├── tests/
│   │   └── README.md
│   │
│   ├── parsers/
│   │   │
│   │   ├── openapi/             # @opengenerator/parser-openapi
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── parser.ts    # OpenAPI 3.0/3.1 parser
│   │   │   │   ├── converter.ts # OpenAPI → IR conversion
│   │   │   │   └── validators.ts
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── prisma/              # @opengenerator/parser-prisma
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── parser.ts    # Prisma schema parser
│   │   │   │   ├── converter.ts # Prisma → IR conversion
│   │   │   │   └── relations.ts # Relation handling
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── json-schema/         # @opengenerator/parser-json-schema
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── parser.ts    # JSON Schema draft-07/2020-12
│   │   │   │   └── converter.ts
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── zod/                 # @opengenerator/parser-zod
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── parser.ts    # Zod schema extraction
│   │   │   │   └── converter.ts
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── typebox/             # @opengenerator/parser-typebox
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── parser.ts    # TypeBox schema extraction
│   │   │   │   └── converter.ts
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   └── vld/                 # @opengenerator/parser-vld
│   │       ├── package.json
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── parser.ts    # @oxog/vld schema extraction
│   │       │   └── converter.ts
│   │       ├── tests/
│   │       └── README.md
│   │
│   ├── generators/
│   │   │
│   │   ├── rest/                # @opengenerator/gen-rest
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── generator.ts # REST endpoint generator
│   │   │   │   ├── routes.ts    # Route definitions
│   │   │   │   ├── controllers.ts
│   │   │   │   ├── middleware.ts
│   │   │   │   ├── openapi.ts   # OpenAPI doc generator
│   │   │   │   └── templates/   # Code templates
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── graphql/             # @opengenerator/gen-graphql
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── generator.ts # GraphQL schema generator
│   │   │   │   ├── typedefs.ts  # Type definitions
│   │   │   │   ├── resolvers.ts # Resolver generator
│   │   │   │   ├── subscriptions.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   └── trpc/                # @opengenerator/gen-trpc
│   │       ├── package.json
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── generator.ts # tRPC router generator
│   │       │   ├── procedures.ts
│   │       │   ├── context.ts
│   │       │   └── templates/
│   │       ├── tests/
│   │       └── README.md
│   │
│   ├── adapters/
│   │   │
│   │   ├── express/             # @opengenerator/adapter-express
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Express adapter
│   │   │   │   ├── middleware.ts
│   │   │   │   ├── error-handler.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── fastify/             # @opengenerator/adapter-fastify
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Fastify adapter
│   │   │   │   ├── plugins.ts   # Fastify plugin registration
│   │   │   │   ├── hooks.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── hono/                # @opengenerator/adapter-hono
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Hono adapter
│   │   │   │   ├── middleware.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── koa/                 # @opengenerator/adapter-koa
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Koa adapter
│   │   │   │   ├── middleware.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   └── standalone/          # @opengenerator/adapter-standalone
│   │       ├── package.json
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── adapter.ts   # Node.js native HTTP adapter
│   │       │   ├── router.ts    # Minimal router
│   │       │   └── templates/
│   │       ├── tests/
│   │       └── README.md
│   │
│   ├── auth/
│   │   │
│   │   ├── jwt/                 # @opengenerator/auth-jwt
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── strategy.ts  # JWT auth strategy
│   │   │   │   ├── tokens.ts    # Access + refresh token handling
│   │   │   │   ├── middleware.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── oauth/               # @opengenerator/auth-oauth
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── strategy.ts  # OAuth2 strategy
│   │   │   │   ├── providers/
│   │   │   │   │   ├── google.ts
│   │   │   │   │   ├── github.ts
│   │   │   │   │   ├── discord.ts
│   │   │   │   │   ├── twitter.ts
│   │   │   │   │   └── custom.ts
│   │   │   │   ├── callback.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── session/             # @opengenerator/auth-session
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── strategy.ts  # Session-based auth
│   │   │   │   ├── stores/
│   │   │   │   │   ├── memory.ts
│   │   │   │   │   ├── redis.ts
│   │   │   │   │   └── database.ts
│   │   │   │   ├── cookies.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── apikey/              # @opengenerator/auth-apikey
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── strategy.ts  # API key auth
│   │   │   │   ├── generator.ts # Key generation
│   │   │   │   ├── rate-limit.ts
│   │   │   │   ├── scopes.ts    # Permission scopes
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── magic-link/          # @opengenerator/auth-magic-link
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── strategy.ts  # Magic link auth
│   │   │   │   ├── email.ts     # Email sending
│   │   │   │   ├── tokens.ts    # One-time tokens
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   └── passkey/             # @opengenerator/auth-passkey
│   │       ├── package.json
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── strategy.ts  # WebAuthn/FIDO2 auth
│   │       │   ├── registration.ts
│   │       │   ├── authentication.ts
│   │       │   └── templates/
│   │       ├── tests/
│   │       └── README.md
│   │
│   ├── database/
│   │   │
│   │   ├── prisma/              # @opengenerator/db-prisma
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Prisma adapter
│   │   │   │   ├── client.ts    # Client generation
│   │   │   │   ├── migrations.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── drizzle/             # @opengenerator/db-drizzle
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Drizzle adapter
│   │   │   │   ├── schema.ts    # Schema generation
│   │   │   │   ├── migrations.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── kysely/              # @opengenerator/db-kysely
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Kysely adapter
│   │   │   │   ├── types.ts     # Type generation
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── typeorm/             # @opengenerator/db-typeorm
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # TypeORM adapter
│   │   │   │   ├── entities.ts  # Entity generation
│   │   │   │   ├── migrations.ts
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── mongoose/            # @opengenerator/db-mongoose
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── adapter.ts   # Mongoose adapter
│   │   │   │   ├── models.ts    # Model generation
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   └── raw-sql/             # @opengenerator/db-raw-sql
│   │       ├── package.json
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── adapter.ts   # Raw SQL adapter
│   │       │   ├── queries.ts   # Query generation
│   │       │   ├── pool.ts      # Connection pooling
│   │       │   └── templates/
│   │       ├── tests/
│   │       └── README.md
│   │
│   ├── deploy/
│   │   │
│   │   ├── docker/              # @opengenerator/deploy-docker
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── generator.ts # Dockerfile generator
│   │   │   │   ├── compose.ts   # docker-compose generator
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── vercel/              # @opengenerator/deploy-vercel
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── generator.ts # vercel.json generator
│   │   │   │   ├── serverless.ts # Serverless adapter
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── railway/             # @opengenerator/deploy-railway
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── generator.ts # railway.toml generator
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── fly/                 # @opengenerator/deploy-fly
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── generator.ts # fly.toml generator
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   ├── lambda/              # @opengenerator/deploy-lambda
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── generator.ts # Lambda handler generator
│   │   │   │   ├── sam.ts       # SAM template
│   │   │   │   ├── cdk.ts       # CDK construct
│   │   │   │   └── templates/
│   │   │   ├── tests/
│   │   │   └── README.md
│   │   │
│   │   └── kubernetes/          # @opengenerator/deploy-kubernetes
│   │       ├── package.json
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   ├── generator.ts # K8s manifest generator
│   │       │   ├── helm.ts      # Helm chart generator
│   │       │   └── templates/
│   │       ├── tests/
│   │       └── README.md
│   │
│   ├── presets/
│   │   │
│   │   ├── fullstack-prisma/    # @opengenerator/preset-fullstack-prisma
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   └── index.ts     # Prisma + REST + GraphQL + Fastify + JWT + Docker
│   │   │   └── README.md
│   │   │
│   │   ├── serverless-drizzle/  # @opengenerator/preset-serverless-drizzle
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   └── index.ts     # Drizzle + REST + Hono + JWT + Vercel
│   │   │   └── README.md
│   │   │
│   │   ├── graphql-apollo/      # @opengenerator/preset-graphql-apollo
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   └── index.ts     # Prisma + GraphQL + Apollo Server + OAuth
│   │   │   └── README.md
│   │   │
│   │   ├── minimal-rest/        # @opengenerator/preset-minimal-rest
│   │   │   ├── package.json
│   │   │   ├── src/
│   │   │   │   └── index.ts     # JSON Schema + REST + Standalone + API Key
│   │   │   └── README.md
│   │   │
│   │   └── enterprise/          # @opengenerator/preset-enterprise
│   │       ├── package.json
│   │       ├── src/
│   │       │   └── index.ts     # Full stack with all features
│   │       └── README.md
│   │
│   └── opengenerator/           # opengenerator (meta package)
│       ├── package.json         # Depends on all packages
│       ├── src/
│       │   └── index.ts         # Re-exports everything
│       └── README.md
│
├── apps/
│   │
│   ├── web/                     # opengenerator.dev
│   │   ├── package.json
│   │   ├── astro.config.mjs     # Astro for docs
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── index.astro  # Landing page
│   │   │   │   ├── docs/        # Documentation
│   │   │   │   └── playground/  # Interactive playground
│   │   │   ├── components/
│   │   │   └── layouts/
│   │   └── public/
│   │
│   └── playground/              # Standalone playground app
│       ├── package.json
│       ├── src/
│       │   ├── index.tsx        # React app
│       │   ├── editor/          # Monaco editor integration
│       │   ├── preview/         # Generated code preview
│       │   └── share/           # Shareable configs
│       └── README.md
│
├── examples/
│   │
│   ├── basic-crud/              # Simple CRUD example
│   │   ├── schema.prisma
│   │   ├── opengenerator.config.ts
│   │   └── README.md
│   │
│   ├── multi-tenant-saas/       # Multi-tenant SaaS example
│   │   ├── schema.prisma
│   │   ├── opengenerator.config.ts
│   │   └── README.md
│   │
│   ├── realtime-chat/           # Real-time chat with subscriptions
│   │   ├── schema.prisma
│   │   ├── opengenerator.config.ts
│   │   └── README.md
│   │
│   ├── e-commerce/              # E-commerce API
│   │   ├── schema.prisma
│   │   ├── opengenerator.config.ts
│   │   └── README.md
│   │
│   └── microservices/           # Microservices architecture
│       ├── services/
│       │   ├── users/
│       │   ├── products/
│       │   └── orders/
│       └── README.md
│
└── templates/                   # Shared code templates
    ├── typescript/
    │   ├── controller.ts.hbs
    │   ├── service.ts.hbs
    │   ├── middleware.ts.hbs
    │   └── types.ts.hbs
    ├── tests/
    │   ├── unit.test.ts.hbs
    │   └── integration.test.ts.hbs
    └── docs/
        └── openapi.yaml.hbs
```

---

## Core Architecture

### Universal Schema IR (Intermediate Representation)

All parsers convert their input to this universal format:

```typescript
// packages/core/src/types/schema.ts

export interface SchemaIR {
  version: '1.0.0'
  metadata: SchemaMetadata
  models: Model[]
  enums: Enum[]
  relations: Relation[]
}

export interface SchemaMetadata {
  name: string
  description?: string
  source: 'openapi' | 'prisma' | 'json-schema' | 'zod' | 'typebox' | 'vld'
  sourceVersion?: string
}

export interface Model {
  name: string
  description?: string
  fields: Field[]
  indexes?: Index[]
  constraints?: Constraint[]
  
  // Generation hints
  crud: CrudConfig
  auth?: AuthConfig
  softDelete?: boolean
  timestamps?: boolean
}

export interface Field {
  name: string
  type: FieldType
  description?: string
  required: boolean
  unique?: boolean
  default?: unknown
  
  // Validation
  validation?: ValidationRules
  
  // Relations
  relation?: FieldRelation
}

export type FieldType =
  | { kind: 'scalar'; type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'bigint' }
  | { kind: 'enum'; name: string }
  | { kind: 'array'; of: FieldType }
  | { kind: 'object'; fields: Field[] }
  | { kind: 'reference'; model: string }

export interface ValidationRules {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  email?: boolean
  url?: boolean
  uuid?: boolean
  custom?: string // Custom validation function name
}

export interface CrudConfig {
  create: boolean
  read: boolean
  update: boolean
  delete: boolean
  list: boolean
  
  // Advanced
  bulkCreate?: boolean
  bulkUpdate?: boolean
  bulkDelete?: boolean
  upsert?: boolean
}

export interface Relation {
  name: string
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
  from: { model: string; field: string }
  to: { model: string; field: string }
  onDelete?: 'cascade' | 'set-null' | 'restrict'
  onUpdate?: 'cascade' | 'set-null' | 'restrict'
}

export interface Enum {
  name: string
  values: EnumValue[]
}

export interface EnumValue {
  name: string
  value?: string | number
  description?: string
}
```

### Plugin Interfaces

```typescript
// packages/core/src/types/parser.ts

export interface ParserPlugin {
  name: string
  version: string
  
  /** File extensions this parser handles */
  extensions: string[]
  
  /** Check if this parser can handle the input */
  canParse(input: string | Buffer): boolean
  
  /** Parse input to SchemaIR */
  parse(input: string | Buffer, options?: ParserOptions): Promise<SchemaIR>
  
  /** Validate input before parsing */
  validate?(input: string | Buffer): ValidationResult
}

// packages/core/src/types/generator.ts

export interface GeneratorPlugin {
  name: string
  version: string
  
  /** API style this generator produces */
  style: 'rest' | 'graphql' | 'trpc'
  
  /** Generate code from SchemaIR */
  generate(schema: SchemaIR, options: GeneratorOptions): Promise<GeneratedCode>
  
  /** Get required dependencies */
  getDependencies(): Dependency[]
}

export interface GeneratedCode {
  files: GeneratedFile[]
  dependencies: Dependency[]
}

export interface GeneratedFile {
  path: string
  content: string
  overwrite?: boolean
}

// packages/core/src/types/adapter.ts

export interface AdapterPlugin {
  name: string
  version: string
  
  /** Framework this adapter targets */
  framework: 'express' | 'fastify' | 'hono' | 'koa' | 'standalone'
  
  /** Adapt generated code for the target framework */
  adapt(code: GeneratedCode, options: AdapterOptions): Promise<GeneratedCode>
  
  /** Get framework-specific dependencies */
  getDependencies(): Dependency[]
}

// packages/core/src/types/auth.ts

export interface AuthPlugin {
  name: string
  version: string
  
  /** Auth strategy type */
  strategy: 'jwt' | 'oauth' | 'session' | 'apikey' | 'magic-link' | 'passkey'
  
  /** Generate auth code */
  generate(schema: SchemaIR, options: AuthOptions): Promise<GeneratedCode>
  
  /** Get middleware for protecting routes */
  getMiddleware(): MiddlewareDefinition[]
}

// packages/core/src/types/database.ts

export interface DatabasePlugin {
  name: string
  version: string
  
  /** Database adapter type */
  adapter: 'prisma' | 'drizzle' | 'kysely' | 'typeorm' | 'mongoose' | 'raw-sql'
  
  /** Generate database layer code */
  generate(schema: SchemaIR, options: DatabaseOptions): Promise<GeneratedCode>
  
  /** Generate migrations */
  generateMigrations?(schema: SchemaIR, previousSchema?: SchemaIR): Promise<Migration[]>
}

// packages/core/src/types/deploy.ts

export interface DeployPlugin {
  name: string
  version: string
  
  /** Deployment target */
  target: 'docker' | 'vercel' | 'railway' | 'fly' | 'lambda' | 'kubernetes'
  
  /** Generate deployment configuration */
  generate(code: GeneratedCode, options: DeployOptions): Promise<GeneratedCode>
}
```

### Main Generator Class

```typescript
// packages/core/src/generator.ts

import type {
  ParserPlugin,
  GeneratorPlugin,
  AdapterPlugin,
  AuthPlugin,
  DatabasePlugin,
  DeployPlugin,
  SchemaIR,
  GeneratedCode,
  GenerateOptions,
} from './types'

export class OpenGenerator {
  private parserPlugins: Map<string, ParserPlugin> = new Map()
  private generatorPlugins: Map<string, GeneratorPlugin> = new Map()
  private adapterPlugins: Map<string, AdapterPlugin> = new Map()
  private authPlugins: Map<string, AuthPlugin> = new Map()
  private databasePlugins: Map<string, DatabasePlugin> = new Map()
  private deployPlugins: Map<string, DeployPlugin> = new Map()
  
  private selectedParser?: ParserPlugin
  private selectedGenerators: GeneratorPlugin[] = []
  private selectedAdapter?: AdapterPlugin
  private selectedAuth: AuthPlugin[] = []
  private selectedDatabase?: DatabasePlugin
  private selectedDeploy: DeployPlugin[] = []
  
  /**
   * Register a parser plugin
   */
  parser(plugin: ParserPlugin): this {
    this.parserPlugins.set(plugin.name, plugin)
    this.selectedParser = plugin
    return this
  }
  
  /**
   * Register and select a generator plugin
   */
  generator(plugin: GeneratorPlugin): this {
    this.generatorPlugins.set(plugin.name, plugin)
    this.selectedGenerators.push(plugin)
    return this
  }
  
  /**
   * Register and select an adapter plugin
   */
  adapter(plugin: AdapterPlugin): this {
    this.adapterPlugins.set(plugin.name, plugin)
    this.selectedAdapter = plugin
    return this
  }
  
  /**
   * Register and select auth plugins
   */
  auth(plugin: AuthPlugin): this {
    this.authPlugins.set(plugin.name, plugin)
    this.selectedAuth.push(plugin)
    return this
  }
  
  /**
   * Register and select a database plugin
   */
  database(plugin: DatabasePlugin): this {
    this.databasePlugins.set(plugin.name, plugin)
    this.selectedDatabase = plugin
    return this
  }
  
  /**
   * Register and select deploy plugins
   */
  deploy(plugin: DeployPlugin): this {
    this.deployPlugins.set(plugin.name, plugin)
    this.selectedDeploy.push(plugin)
    return this
  }
  
  /**
   * Parse schema file to IR
   */
  async parse(input: string): Promise<SchemaIR> {
    if (!this.selectedParser) {
      throw new Error('No parser selected. Call .parser() first.')
    }
    
    const content = await this.readInput(input)
    return this.selectedParser.parse(content)
  }
  
  /**
   * Generate code from schema
   */
  async generate(options: GenerateOptions): Promise<GeneratedCode> {
    const schema = await this.parse(options.schema)
    
    let code: GeneratedCode = { files: [], dependencies: [] }
    
    // 1. Run all generators
    for (const generator of this.selectedGenerators) {
      const generated = await generator.generate(schema, options)
      code = this.mergeCode(code, generated)
    }
    
    // 2. Apply adapter
    if (this.selectedAdapter) {
      code = await this.selectedAdapter.adapt(code, options)
    }
    
    // 3. Add auth
    for (const auth of this.selectedAuth) {
      const authCode = await auth.generate(schema, options)
      code = this.mergeCode(code, authCode)
    }
    
    // 4. Add database layer
    if (this.selectedDatabase) {
      const dbCode = await this.selectedDatabase.generate(schema, options)
      code = this.mergeCode(code, dbCode)
    }
    
    // 5. Add deployment configs
    for (const deploy of this.selectedDeploy) {
      const deployCode = await deploy.generate(code, options)
      code = this.mergeCode(code, deployCode)
    }
    
    // 6. Write to disk
    if (options.output) {
      await this.writeOutput(code, options.output)
    }
    
    return code
  }
  
  /**
   * Watch for schema changes and regenerate
   */
  watch(options: GenerateOptions): Watcher {
    return new Watcher(this, options)
  }
  
  private async readInput(input: string): Promise<string> {
    // Handle file path, URL, or inline content
    // ...
  }
  
  private mergeCode(a: GeneratedCode, b: GeneratedCode): GeneratedCode {
    return {
      files: [...a.files, ...b.files],
      dependencies: this.mergeDependencies(a.dependencies, b.dependencies),
    }
  }
  
  private mergeDependencies(a: Dependency[], b: Dependency[]): Dependency[] {
    // Dedupe and resolve version conflicts
    // ...
  }
  
  private async writeOutput(code: GeneratedCode, output: string): Promise<void> {
    // Write files to disk
    // ...
  }
}

/**
 * Factory function for creating generator instances
 */
export function createGenerator(): OpenGenerator {
  return new OpenGenerator()
}
```

---

## Config File Format

```typescript
// opengenerator.config.ts

import { defineConfig } from 'opengenerator'

export default defineConfig({
  // Schema source
  schema: './prisma/schema.prisma',
  
  // Output directory
  output: './generated',
  
  // API styles to generate
  api: {
    rest: {
      enabled: true,
      prefix: '/api/v1',
      versioning: true,
      pagination: {
        defaultLimit: 20,
        maxLimit: 100,
      },
      sorting: true,
      filtering: true,
    },
    graphql: {
      enabled: true,
      path: '/graphql',
      playground: true,
      subscriptions: true,
    },
    trpc: {
      enabled: false,
    },
  },
  
  // Framework adapter
  adapter: 'fastify',
  
  // Authentication
  auth: {
    strategies: ['jwt', 'oauth'],
    jwt: {
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      algorithm: 'RS256',
    },
    oauth: {
      providers: ['google', 'github'],
      callbackUrl: '/auth/callback',
    },
  },
  
  // Database
  database: {
    adapter: 'prisma',
    migrations: true,
    seeding: true,
  },
  
  // Deployment targets
  deploy: ['docker', 'vercel'],
  
  // Features
  features: {
    swagger: true,
    cors: true,
    rateLimit: {
      enabled: true,
      max: 100,
      windowMs: 60000,
    },
    logging: {
      enabled: true,
      level: 'info',
      format: 'json',
    },
    validation: true,
    errorHandling: true,
    healthCheck: true,
    metrics: true,
    caching: {
      enabled: true,
      ttl: 3600,
    },
  },
  
  // Code generation options
  codegen: {
    typescript: {
      strict: true,
      target: 'ES2022',
    },
    prettier: true,
    eslint: true,
    tests: {
      unit: true,
      integration: true,
      e2e: true,
    },
  },
  
  // Hooks
  hooks: {
    beforeGenerate: async (schema) => {
      // Modify schema before generation
      return schema
    },
    afterGenerate: async (code) => {
      // Post-process generated code
      return code
    },
  },
})
```

---

## CLI Commands

```bash
# Initialize new project
npx opengenerator init
npx opengenerator init --preset fullstack-prisma
npx opengenerator init --interactive

# Generate code
npx opengenerator generate
npx opengenerator generate --config ./custom-config.ts
npx opengenerator generate --schema ./schema.prisma --output ./api

# Watch mode
npx opengenerator watch
npx opengenerator watch --debounce 1000

# Validate schema
npx opengenerator validate
npx opengenerator validate --schema ./schema.prisma

# Show project info
npx opengenerator info
npx opengenerator info --plugins
npx opengenerator info --schema

# List available presets
npx opengenerator presets

# Upgrade generated code
npx opengenerator upgrade
```

---

## Generated Output Structure

```
generated/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── server.ts                # Server setup
│   ├── config.ts                # Configuration
│   │
│   ├── routes/
│   │   ├── index.ts             # Route aggregator
│   │   ├── users.routes.ts
│   │   ├── posts.routes.ts
│   │   └── comments.routes.ts
│   │
│   ├── controllers/
│   │   ├── users.controller.ts
│   │   ├── posts.controller.ts
│   │   └── comments.controller.ts
│   │
│   ├── services/
│   │   ├── users.service.ts
│   │   ├── posts.service.ts
│   │   └── comments.service.ts
│   │
│   ├── repositories/
│   │   ├── users.repository.ts
│   │   ├── posts.repository.ts
│   │   └── comments.repository.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   └── logging.middleware.ts
│   │
│   ├── validators/
│   │   ├── users.validator.ts
│   │   ├── posts.validator.ts
│   │   └── comments.validator.ts
│   │
│   ├── types/
│   │   ├── index.ts
│   │   ├── users.types.ts
│   │   ├── posts.types.ts
│   │   └── comments.types.ts
│   │
│   ├── auth/
│   │   ├── index.ts
│   │   ├── jwt.ts
│   │   ├── oauth.ts
│   │   └── strategies/
│   │
│   ├── database/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   └── migrations/
│   │
│   ├── graphql/                 # If GraphQL enabled
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   ├── resolvers/
│   │   └── typedefs/
│   │
│   └── utils/
│       ├── logger.ts
│       ├── errors.ts
│       └── helpers.ts
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   ├── routes/
│   │   └── database/
│   └── e2e/
│       └── api.e2e.ts
│
├── docs/
│   ├── openapi.yaml             # Generated OpenAPI spec
│   └── README.md                # API documentation
│
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── deploy/
│   ├── vercel.json              # If Vercel selected
│   ├── fly.toml                 # If Fly.io selected
│   └── railway.toml             # If Railway selected
│
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## Non-Negotiable Rules

### Code Quality
- [ ] TypeScript strict mode (`strict: true`)
- [ ] 100% type coverage (no `any` except where absolutely necessary)
- [ ] ESLint + Prettier configuration
- [ ] Comprehensive JSDoc comments
- [ ] All public APIs documented

### Testing
- [ ] Minimum 90% code coverage per package
- [ ] Unit tests for all business logic
- [ ] Integration tests for all plugins
- [ ] E2E tests for generated code
- [ ] Snapshot tests for code generation

### Build & Bundle
- [ ] ESM + CJS dual format
- [ ] Tree-shakeable exports
- [ ] Source maps included
- [ ] Declaration files (`.d.ts`)
- [ ] No circular dependencies

### Performance
- [ ] Core package < 50KB minified
- [ ] Individual plugins < 20KB each
- [ ] Lazy loading for optional features
- [ ] Incremental generation support

### Documentation
- [ ] README with quick start
- [ ] llms.txt for LLM discoverability
- [ ] API reference documentation
- [ ] Migration guides
- [ ] Examples for all features

### Security
- [ ] No eval or dynamic code execution
- [ ] Input validation on all parsers
- [ ] Safe template rendering (no XSS)
- [ ] Dependency audit in CI

---

## Package.json Templates

### Root package.json

```json
{
  "name": "opengenerator-monorepo",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rm -rf node_modules",
    "dev": "turbo run dev",
    "release": "changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.10.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "tsup": "^8.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

### Core package.json

```json
{
  "name": "@opengenerator/core",
  "version": "1.0.0",
  "description": "Core engine for OpenGenerator - Schema-to-API code generator",
  "author": "Ersin KOÇ",
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist", "llms.txt"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "clean": "rm -rf dist"
  },
  "keywords": [
    "code-generator",
    "api-generator",
    "schema",
    "rest",
    "graphql",
    "trpc",
    "typescript"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/opengenerator/opengenerator.git",
    "directory": "packages/core"
  },
  "homepage": "https://opengenerator.dev",
  "bugs": "https://github.com/opengenerator/opengenerator/issues"
}
```

---

## GitHub Workflows

### CI Workflow

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test:coverage
      - run: pnpm lint
      - run: pnpm typecheck
      
      - uses: codecov/codecov-action@v3
        if: matrix.node-version == 20

  e2e:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test:e2e
```

### Publish Workflow

```yaml
# .github/workflows/publish.yml

name: Publish

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      
      - run: pnpm publish -r --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
```

---

## Website Spec (opengenerator.dev)

### Pages

1. **Landing Page** (`/`)
   - Hero: "One Schema. Complete API. Zero Boilerplate."
   - Feature highlights
   - Quick start code example
   - Comparison with alternatives
   - Testimonials
   - CTA: Get Started

2. **Documentation** (`/docs`)
   - Getting Started
   - Configuration
   - Parsers (OpenAPI, Prisma, Zod, etc.)
   - Generators (REST, GraphQL, tRPC)
   - Adapters (Express, Fastify, Hono, etc.)
   - Auth Strategies
   - Database Adapters
   - Deployment
   - API Reference
   - Migration Guide

3. **Playground** (`/playground`)
   - Schema editor (Monaco)
   - Config panel
   - Generated code preview
   - Share functionality
   - Download ZIP

4. **Examples** (`/examples`)
   - Basic CRUD
   - Multi-tenant SaaS
   - E-commerce
   - Real-time Chat
   - Microservices

5. **Blog** (`/blog`)
   - Release notes
   - Tutorials
   - Case studies

### Design

- **Colors**: Electric blue (#0066FF) + Dark (#0A0A0A) + White
- **Font**: Inter for UI, JetBrains Mono for code
- **Style**: Modern, technical, minimal

---

## llms.txt Template

```
# OpenGenerator

> Schema-to-API code generator. One schema, complete API, zero boilerplate.

## Quick Start

npm install opengenerator
npx opengenerator init
npx opengenerator generate

## Core Concept

OpenGenerator transforms schemas (OpenAPI, Prisma, Zod, JSON Schema, TypeBox) into production-ready APIs with:
- REST, GraphQL, tRPC support
- Express, Fastify, Hono, Koa adapters
- JWT, OAuth, Session, API Key authentication
- Prisma, Drizzle, TypeORM database layers
- Docker, Vercel, Railway deployment configs

## Usage

### Programmatic

import { OpenGenerator } from '@opengenerator/core'
import { prismaParser } from '@opengenerator/parser-prisma'
import { restGenerator } from '@opengenerator/gen-rest'
import { fastifyAdapter } from '@opengenerator/adapter-fastify'

const generator = new OpenGenerator()
  .parser(prismaParser())
  .generator(restGenerator())
  .adapter(fastifyAdapter())

await generator.generate({
  schema: './schema.prisma',
  output: './api',
})

### CLI

npx opengenerator generate --schema ./schema.prisma --output ./api

### Config File

// opengenerator.config.ts
import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './generated',
  api: { rest: true, graphql: true },
  adapter: 'fastify',
  auth: { strategies: ['jwt'] },
  database: { adapter: 'prisma' },
  deploy: ['docker'],
})

## Packages

- @opengenerator/core - Core engine
- @opengenerator/cli - Command line interface
- @opengenerator/parser-* - Schema parsers
- @opengenerator/gen-* - API generators
- @opengenerator/adapter-* - Framework adapters
- @opengenerator/auth-* - Auth strategies
- @opengenerator/db-* - Database adapters
- @opengenerator/deploy-* - Deployment configs

## Links

- Docs: https://opengenerator.dev/docs
- GitHub: https://github.com/opengenerator/opengenerator
```

---

## Execution Checklist

When building this project, ensure:

1. **Start with core package** - Build the foundation first
2. **Define all TypeScript interfaces** - Full type definitions before implementation
3. **Implement one parser first** - Prisma parser as reference implementation
4. **Implement one generator first** - REST generator as reference
5. **Implement one adapter first** - Fastify adapter as reference
6. **Build CLI after core works** - CLI wraps programmatic API
7. **Add remaining plugins** - Follow established patterns
8. **Build website last** - After all packages are functional
9. **Write tests alongside code** - Not after
10. **Document as you build** - README + llms.txt per package

---

## Success Criteria

The project is complete when:

- [ ] All 35+ packages published to npm
- [ ] CLI works end-to-end: `npx opengenerator init && npx opengenerator generate`
- [ ] All parsers convert to unified SchemaIR
- [ ] All generators produce valid, working code
- [ ] All adapters produce framework-specific output
- [ ] All auth strategies work with all adapters
- [ ] All database adapters work with all generators
- [ ] All deploy plugins produce valid configs
- [ ] Generated code passes all tests
- [ ] Documentation site live at opengenerator.dev
- [ ] Playground works with all combinations
- [ ] Examples repository with working projects

---

**Author**: Ersin KOÇ
**License**: MIT
**Repository**: github.com/opengenerator/opengenerator
**Website**: opengenerator.dev
