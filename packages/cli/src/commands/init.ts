import { Command } from 'commander'
import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import inquirer from 'inquirer'

import { logger, styled } from '../utils/logger'
import { withSpinner } from '../utils/spinner'

/**
 * Preset configurations
 */
const presets = {
  'fullstack-prisma': {
    name: 'Fullstack Prisma',
    description: 'Prisma + REST + GraphQL + Fastify + JWT + Docker',
    config: {
      schema: './prisma/schema.prisma',
      output: './generated',
      api: {
        rest: { enabled: true, prefix: '/api/v1' },
        graphql: { enabled: true },
      },
      adapter: 'fastify',
      auth: { strategies: ['jwt'] },
      database: { adapter: 'prisma' },
      deploy: ['docker'],
    },
  },
  'serverless-drizzle': {
    name: 'Serverless Drizzle',
    description: 'Drizzle + REST + Hono + JWT + Vercel',
    config: {
      schema: './drizzle/schema.ts',
      output: './generated',
      api: {
        rest: { enabled: true, prefix: '/api' },
      },
      adapter: 'hono',
      auth: { strategies: ['jwt'] },
      database: { adapter: 'drizzle' },
      deploy: ['vercel'],
    },
  },
  'graphql-apollo': {
    name: 'GraphQL Apollo',
    description: 'Prisma + GraphQL + Apollo Server + OAuth',
    config: {
      schema: './prisma/schema.prisma',
      output: './generated',
      api: {
        graphql: { enabled: true, subscriptions: true },
      },
      adapter: 'standalone',
      auth: { strategies: ['oauth'] },
      database: { adapter: 'prisma' },
      deploy: ['docker'],
    },
  },
  'minimal-rest': {
    name: 'Minimal REST',
    description: 'JSON Schema + REST + Standalone + API Key',
    config: {
      schema: './schema.json',
      output: './generated',
      api: {
        rest: { enabled: true },
      },
      adapter: 'standalone',
      auth: { strategies: ['apikey'] },
      deploy: [],
    },
  },
  'enterprise': {
    name: 'Enterprise',
    description: 'Full stack with all features',
    config: {
      schema: './prisma/schema.prisma',
      output: './generated',
      api: {
        rest: { enabled: true, prefix: '/api/v1' },
        graphql: { enabled: true },
        trpc: { enabled: true },
      },
      adapter: 'fastify',
      auth: { strategies: ['jwt', 'oauth', 'session'] },
      database: { adapter: 'prisma' },
      deploy: ['docker', 'kubernetes'],
      features: {
        swagger: true,
        cors: true,
        rateLimit: true,
        logging: true,
        metrics: true,
        caching: true,
      },
    },
  },
}

type PresetName = keyof typeof presets

/**
 * Init command
 */
export const initCommand = new Command('init')
  .description('Initialize a new OpenGenerator project')
  .option('-p, --preset <name>', 'Use a preset configuration')
  .option('-i, --interactive', 'Run interactive wizard')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-f, --force', 'Overwrite existing configuration')
  .action(async (options) => {
    const targetDir = resolve(options.dir)
    const configPath = join(targetDir, 'opengenerator.config.ts')

    // Check if config already exists
    if (existsSync(configPath) && !options.force) {
      logger.error(`Configuration already exists at ${styled.path(configPath)}`)
      logger.info(`Use ${styled.command('--force')} to overwrite`)
      process.exit(1)
    }

    let config: Record<string, unknown>

    if (options.preset) {
      // Use preset
      const presetName = options.preset as PresetName
      if (!presets[presetName]) {
        logger.error(`Unknown preset: ${presetName}`)
        logger.info(`Available presets: ${Object.keys(presets).join(', ')}`)
        process.exit(1)
      }
      config = presets[presetName].config
      logger.info(`Using preset: ${styled.bold(presets[presetName].name)}`)
    } else if (options.interactive) {
      // Interactive wizard
      config = await runWizard()
    } else {
      // Prompt for preset selection
      const { preset } = await inquirer.prompt<{ preset: PresetName }>([
        {
          type: 'list',
          name: 'preset',
          message: 'Choose a preset:',
          choices: Object.entries(presets).map(([key, value]) => ({
            name: `${value.name} - ${styled.dim(value.description)}`,
            value: key,
          })),
        },
      ])
      config = presets[preset].config
    }

    // Create directory if needed
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true })
    }

    // Generate configuration file
    await withSpinner(
      async () => {
        const configContent = generateConfigFile(config)
        await writeFile(configPath, configContent, 'utf-8')
      },
      {
        start: 'Creating configuration file...',
        success: `Configuration created at ${styled.path(configPath)}`,
        fail: 'Failed to create configuration',
      }
    )

    // Show next steps
    logger.newLine()
    logger.title('Next steps:')
    logger.list([
      `Edit ${styled.path('opengenerator.config.ts')} to customize your configuration`,
      `Run ${styled.command('opengenerator generate')} to generate code`,
      `Check ${styled.path('./generated')} for the generated files`,
    ])
    logger.newLine()
  })

/**
 * Run interactive wizard
 */
async function runWizard(): Promise<Record<string, unknown>> {
  logger.title('OpenGenerator Setup Wizard')

  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'schemaType',
      message: 'What type of schema do you have?',
      choices: [
        { name: 'Prisma schema', value: 'prisma' },
        { name: 'OpenAPI specification', value: 'openapi' },
        { name: 'Zod schemas', value: 'zod' },
        { name: 'JSON Schema', value: 'json-schema' },
        { name: 'TypeBox schemas', value: 'typebox' },
      ],
    },
    {
      type: 'input',
      name: 'schemaPath',
      message: 'Path to your schema file:',
      default: (answers: { schemaType: string }) => {
        switch (answers.schemaType) {
          case 'prisma':
            return './prisma/schema.prisma'
          case 'openapi':
            return './openapi.yaml'
          case 'zod':
            return './src/schemas/index.ts'
          case 'json-schema':
            return './schema.json'
          case 'typebox':
            return './src/schemas/index.ts'
          default:
            return './schema'
        }
      },
    },
    {
      type: 'checkbox',
      name: 'apiStyles',
      message: 'Which API styles do you want to generate?',
      choices: [
        { name: 'REST API', value: 'rest', checked: true },
        { name: 'GraphQL API', value: 'graphql' },
        { name: 'tRPC API', value: 'trpc' },
      ],
    },
    {
      type: 'list',
      name: 'framework',
      message: 'Which framework do you want to use?',
      choices: [
        { name: 'Fastify (Recommended)', value: 'fastify' },
        { name: 'Express', value: 'express' },
        { name: 'Hono (Edge-ready)', value: 'hono' },
        { name: 'Koa', value: 'koa' },
        { name: 'Standalone (No framework)', value: 'standalone' },
      ],
    },
    {
      type: 'checkbox',
      name: 'authStrategies',
      message: 'Which authentication strategies do you need?',
      choices: [
        { name: 'JWT', value: 'jwt', checked: true },
        { name: 'OAuth2 (Google, GitHub, etc.)', value: 'oauth' },
        { name: 'Session-based', value: 'session' },
        { name: 'API Keys', value: 'apikey' },
        { name: 'Magic Link', value: 'magic-link' },
        { name: 'Passkeys (WebAuthn)', value: 'passkey' },
      ],
    },
    {
      type: 'list',
      name: 'database',
      message: 'Which database adapter do you want to use?',
      choices: [
        { name: 'Prisma', value: 'prisma' },
        { name: 'Drizzle', value: 'drizzle' },
        { name: 'Kysely', value: 'kysely' },
        { name: 'TypeORM', value: 'typeorm' },
        { name: 'Mongoose (MongoDB)', value: 'mongoose' },
        { name: 'Raw SQL', value: 'raw-sql' },
      ],
    },
    {
      type: 'checkbox',
      name: 'deployTargets',
      message: 'Where do you plan to deploy?',
      choices: [
        { name: 'Docker', value: 'docker', checked: true },
        { name: 'Vercel', value: 'vercel' },
        { name: 'Railway', value: 'railway' },
        { name: 'Fly.io', value: 'fly' },
        { name: 'AWS Lambda', value: 'lambda' },
        { name: 'Kubernetes', value: 'kubernetes' },
      ],
    },
  ])

  // Build configuration from answers
  const config: Record<string, unknown> = {
    schema: answers.schemaPath,
    output: './generated',
    api: {},
    adapter: answers.framework,
  }

  // API styles
  if (answers.apiStyles.includes('rest')) {
    (config.api as Record<string, unknown>).rest = { enabled: true, prefix: '/api/v1' }
  }
  if (answers.apiStyles.includes('graphql')) {
    (config.api as Record<string, unknown>).graphql = { enabled: true }
  }
  if (answers.apiStyles.includes('trpc')) {
    (config.api as Record<string, unknown>).trpc = { enabled: true }
  }

  // Auth
  if (answers.authStrategies.length > 0) {
    config.auth = { strategies: answers.authStrategies }
  }

  // Database
  config.database = { adapter: answers.database }

  // Deploy
  if (answers.deployTargets.length > 0) {
    config.deploy = answers.deployTargets
  }

  return config
}

/**
 * Generate configuration file content
 */
function generateConfigFile(config: Record<string, unknown>): string {
  const configStr = JSON.stringify(config, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")

  return `import { defineConfig } from 'opengenerator'

export default defineConfig(${configStr})
`
}
