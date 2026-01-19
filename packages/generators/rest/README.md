# @opengenerator/gen-rest

REST API generator for OpenGenerator.

## Installation

```bash
npm install @opengenerator/gen-rest
# or
pnpm add @opengenerator/gen-rest
```

## Usage

```typescript
import { createRestGenerator } from '@opengenerator/gen-rest'
import { prismaParser } from '@opengenerator/parser-prisma'

const generator = createRestGenerator({
  prefix: '/api/v1',
  openapi: true,
  pagination: true,
  filtering: true,
  sorting: true,
})

const schema = await prismaParser.parse(prismaSchema)
const code = await generator.generate(schema)

// Generated files:
// - types.ts - TypeScript types
// - routes.ts - Route definitions
// - controllers/*.controller.ts - Controllers
// - validation.ts - Zod validation schemas
// - openapi.json - OpenAPI specification
```

## Options

```typescript
interface RestGeneratorOptions {
  // API prefix (default: '/api/v1')
  prefix?: string

  // Generate OpenAPI spec (default: true)
  openapi?: boolean

  // OpenAPI version (default: '3.0')
  openapiVersion?: '3.0' | '3.1'

  // Include pagination (default: true)
  pagination?: boolean

  // Include filtering (default: true)
  filtering?: boolean

  // Include sorting (default: true)
  sorting?: boolean

  // Include soft delete (default: false)
  softDelete?: boolean

  // Generate Zod validation (default: true)
  validation?: boolean

  // HTTP methods to generate
  methods?: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>

  // Generate bulk operations (default: false)
  bulkOperations?: boolean

  // Generate nested routes (default: true)
  nestedRoutes?: boolean

  // Response format
  responseFormat?: 'json-api' | 'simple' | 'hal'
}
```

## Generated Code

### Types (types.ts)

```typescript
export interface User {
  id: string
  email: string
  name: string | null
  createdAt: Date
  updatedAt: Date
}

export interface UserCreateInput {
  email: string
  name?: string | null
}

export interface UserUpdateInput {
  email?: string
  name?: string | null
}
```

### Routes (routes.ts)

```typescript
export const routes = [
  { method: 'GET', path: '/api/v1/users', handler: 'userController.list' },
  { method: 'GET', path: '/api/v1/users/:id', handler: 'userController.getById' },
  { method: 'POST', path: '/api/v1/users', handler: 'userController.create' },
  { method: 'PUT', path: '/api/v1/users/:id', handler: 'userController.update' },
  { method: 'DELETE', path: '/api/v1/users/:id', handler: 'userController.delete' },
]
```

### Controllers

```typescript
export class UserController {
  async list(params): Promise<PaginatedResponse<User>>
  async getById(id: string): Promise<User>
  async create(data: UserCreateInput): Promise<User>
  async update(id: string, data: UserUpdateInput): Promise<User>
  async delete(id: string): Promise<void>
}
```

## License

MIT
