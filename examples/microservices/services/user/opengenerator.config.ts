/**
 * User Service Configuration
 */

import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './src/generated',

  api: {
    rest: {
      enabled: true,
      prefix: '/api',
    },
  },

  adapter: 'fastify',

  auth: {
    strategies: ['jwt'],
  },

  database: {
    adapter: 'prisma',
  },

  codegen: {
    types: true,
    validation: true,
  },
})
