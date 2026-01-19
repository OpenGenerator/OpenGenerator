/**
 * OpenGenerator - Schema-to-API Code Generator
 *
 * This is the main entry point that re-exports all packages.
 * Install: npm install opengenerator
 */

// Core
export * from '@opengenerator/core'

// Parsers
export { prismaParser, createPrismaParser } from '@opengenerator/parser-prisma'
export { openApiParser, createOpenApiParser } from '@opengenerator/parser-openapi'
export { jsonSchemaParser, createJsonSchemaParser } from '@opengenerator/parser-json-schema'
export { zodParser, createZodParser } from '@opengenerator/parser-zod'
export { typeboxParser, createTypeboxParser } from '@opengenerator/parser-typebox'
export { vldParser, createVldParser } from '@opengenerator/parser-vld'

// Generators
export { restGenerator, createRestGenerator } from '@opengenerator/gen-rest'
export { graphqlGenerator, createGraphQLGenerator } from '@opengenerator/gen-graphql'
export { trpcGenerator, createTRPCGenerator } from '@opengenerator/gen-trpc'

// Adapters
export { expressAdapter, createExpressAdapter } from '@opengenerator/adapter-express'
export { fastifyAdapter, createFastifyAdapter } from '@opengenerator/adapter-fastify'
export { honoAdapter, createHonoAdapter } from '@opengenerator/adapter-hono'
export { koaAdapter, createKoaAdapter } from '@opengenerator/adapter-koa'
export { standaloneAdapter, createStandaloneAdapter } from '@opengenerator/adapter-standalone'

// Auth
export { jwtAuth, createJWTAuth } from '@opengenerator/auth-jwt'
export { oauthAuth, createOAuth } from '@opengenerator/auth-oauth'
export { sessionAuth, createSessionAuth } from '@opengenerator/auth-session'
export { apiKeyAuth, createApiKeyAuth } from '@opengenerator/auth-apikey'
export { magicLinkAuth, createMagicLinkAuth } from '@opengenerator/auth-magic-link'
export { passkeyAuth, createPasskeyAuth } from '@opengenerator/auth-passkey'

// Database
export { prismaDatabase, createPrismaDatabase } from '@opengenerator/db-prisma'
export { drizzleDatabase, createDrizzleDatabase } from '@opengenerator/db-drizzle'
export { kyselyDatabase, createKyselyDatabase } from '@opengenerator/db-kysely'
export { typeormDatabase, createTypeORMDatabase } from '@opengenerator/db-typeorm'
export { mongooseDatabase, createMongooseDatabase } from '@opengenerator/db-mongoose'
export { rawSqlDatabase, createRawSQLDatabase } from '@opengenerator/db-raw-sql'

// Deploy
export { dockerDeploy, createDockerDeploy } from '@opengenerator/deploy-docker'
export { vercelDeploy, createVercelDeploy } from '@opengenerator/deploy-vercel'
export { railwayDeploy, createRailwayDeploy } from '@opengenerator/deploy-railway'
export { flyDeploy, createFlyDeploy } from '@opengenerator/deploy-fly'
export { lambdaDeploy, createLambdaDeploy } from '@opengenerator/deploy-lambda'
export { k8sDeploy, createK8sDeploy } from '@opengenerator/deploy-kubernetes'

// Presets
export { fullstackPrismaPreset } from '@opengenerator/preset-fullstack-prisma'
export { serverlessDrizzlePreset } from '@opengenerator/preset-serverless-drizzle'
export { graphqlApolloPreset } from '@opengenerator/preset-graphql-apollo'
export { minimalRestPreset } from '@opengenerator/preset-minimal-rest'
export { enterprisePreset } from '@opengenerator/preset-enterprise'
