# @opengenerator/cli

Command-line interface for OpenGenerator - Schema-to-API code generator.

## Installation

```bash
npm install -g @opengenerator/cli
# or
pnpm add -g @opengenerator/cli
# or
npx opengenerator
```

## Commands

### `opengenerator init`

Initialize a new OpenGenerator project.

```bash
# Interactive mode
opengenerator init

# With preset
opengenerator init --preset fullstack-prisma

# Interactive wizard
opengenerator init --interactive

# To specific directory
opengenerator init --dir ./my-api
```

**Available presets:**
- `fullstack-prisma` - Prisma + REST + GraphQL + Fastify + JWT + Docker
- `serverless-drizzle` - Drizzle + REST + Hono + JWT + Vercel
- `graphql-apollo` - Prisma + GraphQL + Apollo Server + OAuth
- `minimal-rest` - JSON Schema + REST + Standalone + API Key
- `enterprise` - Full stack with all features

### `opengenerator generate`

Generate code from schema.

```bash
# Using configuration file
opengenerator generate

# With custom config
opengenerator generate --config ./custom-config.ts

# Override schema and output
opengenerator generate --schema ./schema.prisma --output ./api

# Dry run (preview changes)
opengenerator generate --dry-run

# Verbose output
opengenerator generate --verbose
```

### `opengenerator watch`

Watch for schema changes and regenerate.

```bash
# Start watching
opengenerator watch

# With custom debounce
opengenerator watch --debounce 1000

# Verbose output
opengenerator watch --verbose
```

### `opengenerator validate`

Validate schema and configuration.

```bash
# Validate current project
opengenerator validate

# Validate specific schema
opengenerator validate --schema ./schema.prisma

# Verbose output
opengenerator validate --verbose
```

### `opengenerator info`

Show project and environment information.

```bash
# Basic info
opengenerator info

# Include plugins
opengenerator info --plugins

# Include schema info
opengenerator info --schema

# JSON output
opengenerator info --json
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
    strategies: ['jwt', 'oauth'],
  },

  database: {
    adapter: 'prisma',
  },

  deploy: ['docker', 'vercel'],
})
```

## Aliases

- `opengenerator` - Full command
- `og` - Short alias

## Exit Codes

- `0` - Success
- `1` - Error

## License

MIT - see [LICENSE](../../LICENSE) for details.
