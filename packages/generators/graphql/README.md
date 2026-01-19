# @opengenerator/gen-graphql

GraphQL API generator for OpenGenerator.

## Installation

```bash
npm install @opengenerator/gen-graphql
# or
pnpm add @opengenerator/gen-graphql
```

## Usage

```typescript
import { createGraphQLGenerator } from '@opengenerator/gen-graphql'
import { prismaParser } from '@opengenerator/parser-prisma'

const generator = createGraphQLGenerator({
  subscriptions: true,
  relay: false,
  pagination: true,
  dataLoader: true,
  library: 'graphql-yoga',
})

const schema = await prismaParser.parse(prismaSchema)
const code = await generator.generate(schema)

// Generated files:
// - schema.graphql - GraphQL SDL
// - types.ts - TypeScript types
// - resolvers.ts - GraphQL resolvers
// - context.ts - Context type
// - dataloaders.ts - DataLoader patterns
// - index.ts - Main entry
```

## Options

```typescript
interface GraphQLGeneratorOptions {
  // Code-first or schema-first (default: 'schema-first')
  approach?: 'code-first' | 'schema-first'

  // Generate subscriptions (default: false)
  subscriptions?: boolean

  // Use Relay-style connections (default: false)
  relay?: boolean

  // Include pagination (default: true)
  pagination?: boolean

  // Include filtering (default: true)
  filtering?: boolean

  // Include sorting (default: true)
  sorting?: boolean

  // Generate DataLoader patterns (default: true)
  dataLoader?: boolean

  // Generate input validation (default: true)
  validation?: boolean

  // Target GraphQL library
  library?: 'graphql-yoga' | 'apollo-server' | 'mercurius' | 'generic'

  // Generate federation support (default: false)
  federation?: boolean
}
```

## Generated Schema

```graphql
type User {
  id: ID!
  email: String!
  name: String
  posts: [Post!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type Query {
  users(filter: UserFilterInput, orderBy: UserOrderByInput, page: Int, limit: Int): UserList!
  user(id: ID!): User
}

type Mutation {
  createUser(data: UserCreateInput!): User!
  updateUser(id: ID!, data: UserUpdateInput!): User!
  deleteUser(id: ID!): User
}

type Subscription {
  userCreated: User!
  userUpdated: User!
  userDeleted: User!
}
```

## License

MIT
