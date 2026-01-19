/**
 * Realtime Chat Example Configuration
 */

import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './src/generated',

  api: {
    graphql: {
      enabled: true,
      path: '/graphql',
      subscriptions: true,
      playground: true,
    },
  },

  adapter: 'standalone',

  auth: {
    strategies: ['jwt'],
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '24h',
    },
  },

  database: {
    adapter: 'prisma',
  },

  codegen: {
    types: true,
    validation: true,
    tests: true,
  },

  // PubSub configuration for subscriptions
  pubsub: {
    adapter: 'redis',
    redis: {
      url: process.env.REDIS_URL,
    },
  },
})
