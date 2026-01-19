/**
 * User Service
 * Handles authentication and user management
 */

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { z } from 'zod'

const fastify = Fastify({ logger: true })
const prisma = new PrismaClient()

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'secret')

// Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

async function generateToken(userId: string, email: string) {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

async function main() {
  await fastify.register(cors)

  // Health check
  fastify.get('/health', async () => ({
    service: 'user-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  // Register
  fastify.post('/api/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' })
    }

    const passwordHash = await bcrypt.hash(body.password, 10)

    const user = await prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        firstName: body.firstName,
        lastName: body.lastName,
      },
    })

    const token = await generateToken(user.id, user.email)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    }
  })

  // Login
  fastify.post('/api/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = await generateToken(user.id, user.email)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    }
  })

  // Get current user
  fastify.get('/api/users/me', async (request, reply) => {
    const userId = request.headers['x-user-id'] as string
    if (!userId) {
      return reply.status(401).send({ error: 'Not authenticated' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
    }
  })

  // Get user by ID (internal)
  fastify.get('/api/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return reply.status(404).send({ error: 'User not found' })
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
    }
  })

  const port = Number(process.env.PORT) || 3001
  await fastify.listen({ port, host: '0.0.0.0' })

  console.log(`👤 User Service running on port ${port}`)
}

main().catch(console.error)
