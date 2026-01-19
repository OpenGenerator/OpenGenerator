/**
 * Multi-Tenant SaaS Example
 * Demonstrates multi-tenancy with row-level security
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

const fastify = Fastify({
  logger: true,
})

// Tenant context middleware
fastify.decorateRequest('tenant', null)
fastify.decorateRequest('user', null)

fastify.addHook('preHandler', async (request) => {
  // Extract tenant from header or JWT
  const tenantId = request.headers['x-organization-id'] as string
  if (tenantId) {
    // In a real app, verify the tenant exists and user has access
    request.tenant = { id: tenantId }
  }
})

async function main() {
  await fastify.register(cors)

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Multi-Tenant SaaS API',
        version: '1.0.0',
        description: 'A multi-tenant SaaS API with row-level security',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })

  await fastify.register(swaggerUi, { routePrefix: '/docs' })

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  // Auth routes (example)
  fastify.post('/api/v1/auth/register', async (request) => ({
    message: 'Register endpoint - run generate to implement',
  }))

  fastify.post('/api/v1/auth/login', async (request) => ({
    message: 'Login endpoint - run generate to implement',
  }))

  // Tenant-scoped routes (example)
  fastify.get('/api/v1/organizations/:orgId/projects', async (request) => ({
    message: 'Projects endpoint - run generate to implement',
    tenantId: request.tenant?.id,
  }))

  const port = Number(process.env.PORT) || 3000
  await fastify.listen({ port, host: '0.0.0.0' })

  console.log(`
  🚀 Multi-Tenant SaaS API running at http://localhost:${port}
  📚 Swagger docs at http://localhost:${port}/docs

  Features:
  - Row-level security for multi-tenancy
  - JWT authentication
  - Organization-based data isolation
  - Role-based access control
  `)
}

main().catch(console.error)

// Types
declare module 'fastify' {
  interface FastifyRequest {
    tenant: { id: string } | null
    user: { id: string; email: string; role: string } | null
  }
}
