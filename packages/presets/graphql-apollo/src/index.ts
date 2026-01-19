/**
 * @opengenerator/preset-graphql-apollo
 * GraphQL Apollo preset: Prisma + GraphQL + Apollo Server + OAuth
 */

import type { OpenGeneratorConfig } from '@opengenerator/core'

export const graphqlApolloPreset: Partial<OpenGeneratorConfig> = {
  schema: './schema.prisma',
  api: {
    graphql: { enabled: true, path: '/graphql', playground: true, subscriptions: true },
  },
  adapter: 'express',
  auth: {
    strategies: ['oauth'],
    oauth: { providers: ['google', 'github'] }
  },
  database: { adapter: 'prisma', migrations: true, seeding: true },
  deploy: ['docker'],
  output: './generated',
}

export default graphqlApolloPreset
