/**
 * API Gateway
 * Routes requests to appropriate microservices
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import httpProxy from '@fastify/http-proxy'
import rateLimit from '@fastify/rate-limit'
import { jwtVerify } from 'jose'
import { Redis } from 'ioredis'

const fastify = Fastify({ logger: true })
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

// Service URLs
const services = {
  user: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
}

// JWT verification
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload
}

// Auth middleware
fastify.decorateRequest('user', null)

fastify.addHook('preHandler', async (request) => {
  const authHeader = request.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7)
      request.user = await verifyToken(token)
    } catch {
      // Token invalid, continue without user
    }
  }
})

async function main() {
  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    redis,
  })

  await fastify.register(cors)

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    services: Object.keys(services),
    timestamp: new Date().toISOString(),
  }))

  // Service health aggregation
  fastify.get('/health/services', async () => {
    const checks = await Promise.all(
      Object.entries(services).map(async ([name, url]) => {
        try {
          const response = await fetch(`${url}/health`)
          return { name, status: response.ok ? 'healthy' : 'unhealthy' }
        } catch {
          return { name, status: 'unreachable' }
        }
      })
    )
    return { services: checks }
  })

  // Route to User Service
  await fastify.register(httpProxy, {
    upstream: services.user,
    prefix: '/api/users',
    rewritePrefix: '/api/users',
    preHandler: async (request, reply) => {
      // Add user context to upstream request
      if (request.user) {
        request.headers['x-user-id'] = request.user.sub as string
      }
    },
  })

  await fastify.register(httpProxy, {
    upstream: services.user,
    prefix: '/api/auth',
    rewritePrefix: '/api/auth',
  })

  // Route to Product Service
  await fastify.register(httpProxy, {
    upstream: services.product,
    prefix: '/api/products',
    rewritePrefix: '/api/products',
  })

  await fastify.register(httpProxy, {
    upstream: services.product,
    prefix: '/api/categories',
    rewritePrefix: '/api/categories',
  })

  // Route to Order Service
  await fastify.register(httpProxy, {
    upstream: services.order,
    prefix: '/api/orders',
    rewritePrefix: '/api/orders',
    preHandler: async (request, reply) => {
      // Orders require authentication
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentication required' })
      }
      request.headers['x-user-id'] = request.user.sub as string
    },
  })

  await fastify.register(httpProxy, {
    upstream: services.order,
    prefix: '/api/cart',
    rewritePrefix: '/api/cart',
    preHandler: async (request, reply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Authentication required' })
      }
      request.headers['x-user-id'] = request.user.sub as string
    },
  })

  const port = Number(process.env.PORT) || 3000
  await fastify.listen({ port, host: '0.0.0.0' })

  console.log(`
  🚪 API Gateway running at http://localhost:${port}

  Routes:
  - /api/auth/* → User Service
  - /api/users/* → User Service
  - /api/products/* → Product Service
  - /api/categories/* → Product Service
  - /api/orders/* → Order Service
  - /api/cart/* → Order Service
  `)
}

main().catch(console.error)

declare module 'fastify' {
  interface FastifyRequest {
    user: { sub: string; email?: string } | null
  }
}
