/**
 * Multi-Tenant SaaS Example Configuration
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
        title: 'Multi-Tenant SaaS API',
        version: '1.0.0',
      },
    },
  },

  adapter: 'fastify',

  auth: {
    strategies: ['jwt'],
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '1h',
      refreshExpiresIn: '7d',
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

  // Multi-tenant configuration
  multiTenant: {
    enabled: true,
    strategy: 'row-level', // or 'schema' or 'database'
    tenantIdField: 'organizationId',
    tenantHeader: 'X-Organization-ID',
  },
})
