/**
 * E-commerce API Example
 * Full-featured e-commerce backend with Stripe integration
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

const fastify = Fastify({
  logger: true,
})

async function main() {
  // Register plugins
  await fastify.register(cors)
  await fastify.register(multipart)

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'E-commerce API',
        version: '1.0.0',
        description: 'Full-featured e-commerce API with Stripe integration',
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
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Products', description: 'Product management' },
        { name: 'Cart', description: 'Shopping cart operations' },
        { name: 'Orders', description: 'Order management' },
        { name: 'Payments', description: 'Payment processing' },
      ],
    },
  })

  await fastify.register(swaggerUi, { routePrefix: '/docs' })

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  // Example routes (before generation)
  // Products
  fastify.get('/api/v1/products', async () => ({
    message: 'Run generate to implement',
    data: [],
  }))

  fastify.get('/api/v1/products/:slug', async () => ({
    message: 'Run generate to implement',
  }))

  // Cart
  fastify.get('/api/v1/cart', async () => ({
    message: 'Run generate to implement',
    items: [],
    total: 0,
  }))

  fastify.post('/api/v1/cart/items', async () => ({
    message: 'Run generate to implement',
  }))

  // Checkout
  fastify.post('/api/v1/checkout', async () => ({
    message: 'Run generate to implement',
  }))

  // Stripe webhook
  fastify.post('/webhooks/stripe', {
    config: {
      rawBody: true,
    },
  }, async (request) => {
    // Handle Stripe webhook events
    // - payment_intent.succeeded
    // - payment_intent.payment_failed
    // - checkout.session.completed
    return { received: true }
  })

  const port = Number(process.env.PORT) || 3000
  await fastify.listen({ port, host: '0.0.0.0' })

  console.log(`
  🛒 E-commerce API running at http://localhost:${port}
  📚 Swagger docs at http://localhost:${port}/docs

  Features:
  - Product catalog with categories
  - Shopping cart management
  - Order processing
  - Stripe payment integration
  - User authentication (JWT + OAuth)
  - Reviews and ratings
  - Inventory management
  - Coupon system
  `)
}

main().catch(console.error)
