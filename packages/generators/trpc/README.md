# @opengenerator/gen-trpc

tRPC API generator for OpenGenerator.

## Installation

```bash
npm install @opengenerator/gen-trpc
# or
pnpm add @opengenerator/gen-trpc
```

## Usage

```typescript
import { createTRPCGenerator } from '@opengenerator/gen-trpc'
import { prismaParser } from '@opengenerator/parser-prisma'

const generator = createTRPCGenerator({
  version: 11,
  react: true,
  subscriptions: false,
  pagination: true,
  superjson: true,
})

const schema = await prismaParser.parse(prismaSchema)
const code = await generator.generate(schema)

// Generated files:
// - schemas.ts - Zod validation schemas
// - trpc.ts - tRPC setup
// - context.ts - Context type
// - routers/*.ts - Model routers
// - router.ts - App router
// - client.ts - tRPC client
// - react.ts - React hooks
// - index.ts - Main entry
```

## Options

```typescript
interface TRPCGeneratorOptions {
  // tRPC version (default: 11)
  version?: 10 | 11

  // Generate React Query hooks (default: true)
  react?: boolean

  // Generate subscriptions (default: false)
  subscriptions?: boolean

  // Include pagination (default: true)
  pagination?: boolean

  // Include filtering (default: true)
  filtering?: boolean

  // Include sorting (default: true)
  sorting?: boolean

  // Generate Zod validation (default: true)
  validation?: boolean

  // Generate client (default: true)
  client?: boolean

  // Use SuperJSON transformer (default: true)
  superjson?: boolean

  // Enable batching (default: true)
  batching?: boolean
}
```

## Generated Code

### Schemas (schemas.ts)

```typescript
export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const userCreateInput = z.object({
  email: z.string(),
  name: z.string().nullable().optional(),
})

export type User = z.infer<typeof userSchema>
```

### Router (routers/user.ts)

```typescript
export const userRouter = router({
  list: publicProcedure
    .input(z.object({
      filter: userFilterInput.optional(),
      pagination: paginationInput.optional(),
      sort: sortInput.optional(),
    }))
    .query(async ({ input, ctx }) => { ... }),

  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => { ... }),

  create: protectedProcedure
    .input(userCreateInput)
    .mutation(async ({ input, ctx }) => { ... }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), data: userUpdateInput }))
    .mutation(async ({ input, ctx }) => { ... }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => { ... }),
})
```

### Client Usage

```typescript
import { createClient } from './client'

const client = createClient('http://localhost:3000/api/trpc')

// List users
const users = await client.user.list.query({
  pagination: { page: 1, limit: 10 },
})

// Create user
const newUser = await client.user.create.mutate({
  email: 'user@example.com',
  name: 'John Doe',
})
```

### React Hooks

```typescript
import { trpc } from './react'

function UserList() {
  const users = trpc.user.list.useQuery({
    pagination: { page: 1, limit: 10 },
  })

  const createUser = trpc.user.create.useMutation()

  return (
    <div>
      {users.data?.items.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

## License

MIT
