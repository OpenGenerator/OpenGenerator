# OpenGenerator Templates

This directory contains Handlebars templates used by OpenGenerator to generate code.

## Template Structure

```
templates/
├── rest/               # REST API templates
│   ├── router.ts.hbs
│   ├── controller.ts.hbs
│   ├── service.ts.hbs
│   ├── repository.ts.hbs
│   ├── schema.ts.hbs
│   └── types.ts.hbs
├── graphql/            # GraphQL templates
│   ├── schema.graphql.hbs
│   ├── resolvers.ts.hbs
│   └── dataloader.ts.hbs
├── trpc/               # tRPC templates
│   └── router.ts.hbs
├── adapters/           # Server adapter templates
│   ├── express.ts.hbs
│   ├── fastify.ts.hbs
│   └── hono.ts.hbs
├── auth/               # Authentication templates
│   └── jwt-middleware.ts.hbs
├── tests/              # Test templates
│   ├── service.test.ts.hbs
│   └── controller.test.ts.hbs
├── deploy/             # Deployment templates
│   ├── Dockerfile.hbs
│   ├── docker-compose.yml.hbs
│   ├── vercel.json.hbs
│   ├── fly.toml.hbs
│   ├── railway.toml.hbs
│   └── kubernetes.yaml.hbs
├── config/             # Configuration templates
│   ├── opengenerator.config.ts.hbs
│   ├── env.example.hbs
│   ├── tsconfig.json.hbs
│   └── package.json.hbs
└── common/             # Shared templates
    ├── types.ts.hbs
    └── errors.ts.hbs
```

## Template Context

Each template receives a context object with the following properties:

### Entity Context

```typescript
interface EntityContext {
  name: string              // Entity name (e.g., "User")
  fields: Field[]           // Entity fields
  relations: Relation[]     // Entity relations
  auth: boolean             // Whether auth is enabled
  validation: boolean       // Whether validation is enabled
  softDelete: boolean       // Whether soft delete is enabled
  database: string          // Database adapter (prisma, drizzle, etc.)
}

interface Field {
  name: string
  type: string
  required: boolean
  isGenerated: boolean
  filterable: boolean
  description?: string
}
```

### Project Context

```typescript
interface ProjectContext {
  projectName: string
  version: string
  description: string
  author: string
  license: string
  adapter: string
  apiPrefix: string
  port: number
  entities: EntityContext[]
}
```

## Handlebars Helpers

OpenGenerator provides these built-in helpers:

### Case Conversion
- `{{pascalCase name}}` → `UserProfile`
- `{{camelCase name}}` → `userProfile`
- `{{kebabCase name}}` → `user-profile`
- `{{snakeCase name}}` → `user_profile`
- `{{constantCase name}}` → `USER_PROFILE`
- `{{lowerCase name}}` → `userprofile`

### Pluralization
- `{{pluralize name}}` → `users` (from `user`)

### Type Conversion
- `{{zodType type}}` → Converts to Zod type (e.g., `z.string()`)
- `{{graphqlType type}}` → Converts to GraphQL type (e.g., `String`)

### Mock Data
- `{{mockValue type}}` → Generates mock value for testing

### Conditionals
- `{{#if auth}}...{{/if}}`
- `{{#unless isGenerated}}...{{/unless}}`
- `{{#each fields}}...{{/each}}`
- `{{#eq database 'prisma'}}...{{/eq}}`

## Custom Templates

You can provide custom templates by setting the `templates` option in your config:

```typescript
export default defineConfig({
  templates: './my-templates',
  // ...
})
```

Custom templates will override the default templates with the same path.

## Creating New Templates

1. Create a `.hbs` file in the appropriate directory
2. Use the context variables and helpers as needed
3. The file extension before `.hbs` determines the output file type

Example:

```handlebars
// templates/custom/my-template.ts.hbs
/**
 * {{pascalCase name}} Custom File
 */

export const {{camelCase name}}Config = {
  name: '{{name}}',
  fields: [
    {{#each fields}}
    '{{name}}',
    {{/each}}
  ],
}
```

## Testing Templates

Run the template tests:

```bash
pnpm test -- --filter templates
```
