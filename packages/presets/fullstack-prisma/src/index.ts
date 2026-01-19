/**
 * @opengenerator/preset-fullstack-prisma
 * Full-stack Prisma preset: Prisma + REST + GraphQL + Fastify + JWT + Docker
 */

import type { OpenGeneratorConfig } from '@opengenerator/core'

export const fullstackPrismaPreset: Partial<OpenGeneratorConfig> = {
  schema: './schema.prisma',
  api: {
    rest: { enabled: true, prefix: '/api/v1', versioning: true, pagination: { style: 'offset', defaultLimit: 20, maxLimit: 100 }, sorting: true, filtering: true },
    graphql: { enabled: true, path: '/graphql', playground: true, subscriptions: false },
  },
  adapter: 'fastify',
  auth: {
    strategies: ['jwt'],
    jwt: { accessTokenExpiry: '1h', refreshTokenExpiry: '7d', algorithm: 'HS256' }
  },
  database: { adapter: 'prisma', migrations: true, seeding: true },
  deploy: ['docker'],
  output: './generated',
}

export default fullstackPrismaPreset
