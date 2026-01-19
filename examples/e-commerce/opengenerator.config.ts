/**
 * E-commerce API Example Configuration
 */

import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './src/generated',

  api: {
    rest: {
      enabled: true,
      prefix: '/api/v1',
      swagger: {
        enabled: true,
        path: '/docs',
        title: 'E-commerce API',
        version: '1.0.0',
      },
    },
  },

  adapter: 'fastify',

  auth: {
    strategies: ['jwt', 'oauth'],
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '1d',
      refreshExpiresIn: '30d',
    },
    oauth: {
      providers: ['google', 'github'],
    },
  },

  database: {
    adapter: 'prisma',
  },

  codegen: {
    types: true,
    validation: true,
    tests: true,
    softDelete: true,
    audit: true,
  },

  // Payment integration
  integrations: {
    stripe: {
      enabled: true,
      webhookPath: '/webhooks/stripe',
    },
  },
})
