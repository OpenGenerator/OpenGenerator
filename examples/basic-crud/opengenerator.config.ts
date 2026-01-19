/**
 * Basic CRUD Example Configuration
 */

import { defineConfig } from 'opengenerator'

export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './src/generated',

  api: {
    rest: {
      enabled: true,
      prefix: '/api',
      swagger: {
        enabled: true,
        path: '/docs',
        title: 'Basic CRUD API',
        version: '1.0.0',
      },
    },
  },

  adapter: 'fastify',

  database: {
    adapter: 'prisma',
  },

  codegen: {
    types: true,
    validation: true,
    tests: true,
  },
})
