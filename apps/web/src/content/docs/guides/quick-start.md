---
title: Quick Start
description: Create your first API with OpenGenerator in under 5 minutes
---

# Quick Start

This guide will help you create a fully functional API from a Prisma schema in just a few steps.

## Prerequisites

- Node.js 20 or later
- npm, pnpm, or yarn

## Step 1: Install OpenGenerator

```bash
# Using npm
npm install opengenerator

# Using pnpm
pnpm add opengenerator

# Using yarn
yarn add opengenerator
```

Or run directly with npx:

```bash
npx opengenerator init
```

## Step 2: Initialize Your Project

Run the interactive wizard:

```bash
npx opengenerator init
```

This will prompt you for:

1. **Project name** - Your project's name
2. **Schema type** - Prisma, OpenAPI, JSON Schema, etc.
3. **API style** - REST, GraphQL, or tRPC
4. **Framework** - Express, Fastify, Hono, etc.
5. **Auth strategy** - JWT, OAuth, Session, etc.
6. **Database** - Prisma, Drizzle, etc.
7. **Deployment** - Docker, Vercel, etc.

Or use a preset for quick setup:

```bash
npx opengenerator init --preset fullstack-prisma
```

## Step 3: Define Your Schema

Create or modify your Prisma schema:

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Step 4: Configure OpenGenerator

Review and customize your config:

```typescript
// opengenerator.config.ts
import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './src/generated',

  api: {
    rest: {
      enabled: true,
      prefix: '/api/v1',
      swagger: {
        enabled: true,
        path: '/docs',
      },
    },
  },

  adapter: 'fastify',

  database: {
    adapter: 'prisma',
  },

  codegen: {
    types: true,
    validation: true,
  },
})
```

## Step 5: Generate Your API

```bash
# Set up your database
npx prisma db push

# Generate the API code
npx opengenerator generate
```

This creates:

```
src/generated/
├── user/
│   ├── user.router.ts
│   ├── user.controller.ts
│   ├── user.service.ts
│   ├── user.repository.ts
│   ├── user.schema.ts
│   └── user.types.ts
├── post/
│   └── ... (same structure)
├── server.ts
├── types.ts
└── errors.ts
```

## Step 6: Run Your Server

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

Your API is now running at `http://localhost:3000`:

- API endpoints: `http://localhost:3000/api/v1/users`
- Swagger docs: `http://localhost:3000/docs`

## Step 7: Test Your API

### Create a User

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com", "name": "John Doe"}'
```

### List Users

```bash
curl http://localhost:3000/api/v1/users
```

### Get User by ID

```bash
curl http://localhost:3000/api/v1/users/clx123abc
```

## What's Next?

Now that you have a working API, explore:

- [Configuration Guide](/guides/configuration/) - Customize every aspect
- [REST Generator](/generators/rest/) - Learn about REST endpoints
- [Authentication](/auth/overview/) - Add user authentication
- [Deployment](/deploy/overview/) - Deploy to production

## Watch Mode

During development, use watch mode to regenerate on schema changes:

```bash
npx opengenerator watch
```
