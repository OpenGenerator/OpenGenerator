/**
 * @opengenerator/preset-enterprise
 * Enterprise preset with all features
 */

import type { OpenGeneratorConfig } from '@opengenerator/core'

export const enterprisePreset: Partial<OpenGeneratorConfig> = {
  schema: './schema.prisma',
  api: {
    rest: { enabled: true, prefix: '/api/v1', versioning: true, pagination: { style: 'offset', defaultLimit: 20, maxLimit: 100 }, sorting: true, filtering: true },
    graphql: { enabled: true, path: '/graphql', playground: true, subscriptions: true },
    trpc: { enabled: true, basePath: '/trpc' },
  },
  adapter: 'fastify',
  auth: {
    strategies: ['jwt', 'oauth'],
    jwt: { accessTokenExpiry: '1h', refreshTokenExpiry: '7d', algorithm: 'HS256' },
    oauth: { providers: ['google', 'github', 'microsoft'] }
  },
  database: { adapter: 'prisma', migrations: true, seeding: true },
  deploy: ['kubernetes', 'docker'],
  output: './generated',
}

export default enterprisePreset
