/**
 * @opengenerator/preset-serverless-drizzle
 * Serverless Drizzle preset: Drizzle + REST + Hono + JWT + Vercel
 */

import type { OpenGeneratorConfig } from '@opengenerator/core'

export const serverlessDrizzlePreset: Partial<OpenGeneratorConfig> = {
  schema: './schema.prisma',
  api: {
    rest: { enabled: true, prefix: '/api', versioning: false, pagination: { style: 'offset', defaultLimit: 20, maxLimit: 100 }, sorting: true, filtering: true },
  },
  adapter: 'hono',
  auth: {
    strategies: ['jwt'],
    jwt: { accessTokenExpiry: '1h', refreshTokenExpiry: '7d', algorithm: 'HS256' }
  },
  database: { adapter: 'drizzle', migrations: true, seeding: true },
  deploy: ['vercel'],
  output: './generated',
}

export default serverlessDrizzlePreset
