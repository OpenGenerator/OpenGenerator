import { Command } from 'commander'
import { resolve, extname } from 'node:path'

import {
  loadConfig,
  createGenerator,
  createPipeline,
  type OpenGeneratorConfig,
  type OpenGenerator,
} from '@opengenerator/core'

import { logger, styled } from '../utils/logger'
import { createProgress } from '../utils/spinner'

/**
 * Detect parser type from file extension
 */
function detectParserType(schemaPath: string): string {
  const ext = extname(schemaPath).toLowerCase()
  switch (ext) {
    case '.prisma':
      return 'prisma'
    case '.json':
      // Could be JSON Schema or OpenAPI
      return 'json-schema'
    case '.yaml':
    case '.yml':
      return 'openapi'
    case '.ts':
    case '.tsx':
      // Could be Zod, TypeBox, or VLD
      return 'zod'
    default:
      return 'json-schema'
  }
}

/**
 * Load and configure plugins based on config
 */
async function configureGenerator(
  generator: OpenGenerator,
  config: OpenGeneratorConfig
): Promise<void> {
  // Detect and load parser
  const parserType = detectParserType(config.schema)

  try {
    switch (parserType) {
      case 'prisma': {
        const { prismaParser } = await import('@opengenerator/parser-prisma')
        generator.parser(prismaParser())
        break
      }
      case 'openapi': {
        const { openApiParser } = await import('@opengenerator/parser-openapi')
        generator.parser(openApiParser())
        break
      }
      case 'zod': {
        const { zodParser } = await import('@opengenerator/parser-zod')
        generator.parser(zodParser())
        break
      }
      case 'typebox': {
        const { typeboxParser } = await import('@opengenerator/parser-typebox')
        generator.parser(typeboxParser())
        break
      }
      case 'json-schema':
      default: {
        const { jsonSchemaParser } = await import('@opengenerator/parser-json-schema')
        generator.parser(jsonSchemaParser())
        break
      }
    }
  } catch (error) {
    throw new Error(`Failed to load parser for ${parserType}: ${(error as Error).message}`)
  }

  // Load generators based on API config
  if (config.api?.rest) {
    try {
      const { restGenerator } = await import('@opengenerator/gen-rest')
      generator.generator(restGenerator)
    } catch (error) {
      logger.warn(`REST generator not available: ${(error as Error).message}`)
    }
  }

  if (config.api?.graphql) {
    try {
      const { graphqlGenerator } = await import('@opengenerator/gen-graphql')
      generator.generator(graphqlGenerator)
    } catch (error) {
      logger.warn(`GraphQL generator not available: ${(error as Error).message}`)
    }
  }

  if (config.api?.trpc) {
    try {
      const { trpcGenerator } = await import('@opengenerator/gen-trpc')
      generator.generator(trpcGenerator)
    } catch (error) {
      logger.warn(`tRPC generator not available: ${(error as Error).message}`)
    }
  }

  // Load adapter
  if (config.adapter) {
    try {
      switch (config.adapter) {
        case 'express': {
          const { expressAdapter } = await import('@opengenerator/adapter-express')
          generator.adapter(expressAdapter)
          break
        }
        case 'fastify': {
          const { fastifyAdapter } = await import('@opengenerator/adapter-fastify')
          generator.adapter(fastifyAdapter)
          break
        }
        case 'hono': {
          const { honoAdapter } = await import('@opengenerator/adapter-hono')
          generator.adapter(honoAdapter)
          break
        }
        case 'koa': {
          const { koaAdapter } = await import('@opengenerator/adapter-koa')
          generator.adapter(koaAdapter)
          break
        }
        case 'standalone': {
          const { standaloneAdapter } = await import('@opengenerator/adapter-standalone')
          generator.adapter(standaloneAdapter)
          break
        }
      }
    } catch (error) {
      logger.warn(`Adapter ${config.adapter} not available: ${(error as Error).message}`)
    }
  }

  // Load auth strategies
  if (config.auth?.strategies) {
    for (const strategy of config.auth.strategies) {
      try {
        switch (strategy) {
          case 'jwt': {
            const { jwtAuth } = await import('@opengenerator/auth-jwt')
            generator.auth(jwtAuth)
            break
          }
          case 'oauth': {
            const { oauthAuth } = await import('@opengenerator/auth-oauth')
            generator.auth(oauthAuth)
            break
          }
          case 'session': {
            const { sessionAuth } = await import('@opengenerator/auth-session')
            generator.auth(sessionAuth)
            break
          }
          case 'apikey': {
            const { apiKeyAuth } = await import('@opengenerator/auth-apikey')
            generator.auth(apiKeyAuth)
            break
          }
          case 'magic-link': {
            const { magicLinkAuth } = await import('@opengenerator/auth-magic-link')
            generator.auth(magicLinkAuth)
            break
          }
          case 'passkey': {
            const { passkeyAuth } = await import('@opengenerator/auth-passkey')
            generator.auth(passkeyAuth)
            break
          }
        }
      } catch (error) {
        logger.warn(`Auth strategy ${strategy} not available: ${(error as Error).message}`)
      }
    }
  }
}

/**
 * Generate command
 */
export const generateCommand = new Command('generate')
  .description('Generate code from schema')
  .alias('gen')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-s, --schema <path>', 'Path to schema file (overrides config)')
  .option('-o, --output <path>', 'Output directory (overrides config)')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--verbose', 'Show detailed output')
  .option('--clean', 'Clean output directory before generating')
  .action(async (options) => {
    const startTime = Date.now()

    try {
      // Load configuration
      const { config, filepath } = await loadConfig(options.config)

      if (filepath) {
        logger.info(`Using configuration from ${styled.path(filepath)}`)
      }

      // Apply CLI overrides
      if (options.schema) {
        config.schema = options.schema
      }
      if (options.output) {
        config.output = options.output
      }

      // Show configuration summary
      if (options.verbose) {
        logger.title('Configuration')
        logger.log(`Schema: ${styled.path(config.schema)}`)
        logger.log(`Output: ${styled.path(config.output)}`)
        logger.newLine()
      }

      // Create generator and configure plugins
      const generator = createGenerator()
      await configureGenerator(generator, config)

      // Create pipeline
      const progress = createProgress(6, 'Starting generation...')
      progress.start()

      const pipeline = createPipeline(generator, {
        hooks: {
          onStageStart: (event) => {
            const stageNames: Record<string, string> = {
              parse: 'Parsing schema...',
              validate: 'Validating configuration...',
              transform: 'Transforming schema...',
              generate: 'Generating code...',
              postProcess: 'Post-processing...',
              write: 'Writing files...',
            }
            progress.update(stageNames[event.stage] ?? `${event.stage}...`)
          },
        },
      })

      // Generate
      const result = await pipeline.run({
        ...config,
        output: resolve(config.output),
        dryRun: options.dryRun,
      })

      progress.succeed()

      // Show results
      const duration = Date.now() - startTime
      logger.newLine()
      logger.success(`Generated ${result.code.files.length} files in ${duration}ms`)

      if (options.verbose) {
        logger.title('Generated Files')
        for (const file of result.code.files) {
          logger.log(`  ${styled.path(file.path)}`)
        }
      }

      if (result.warnings.length > 0) {
        logger.newLine()
        logger.warn('Warnings:')
        for (const warning of result.warnings) {
          logger.log(`  ${styled.yellow(warning)}`)
        }
      }

      if (options.dryRun) {
        logger.newLine()
        logger.info('Dry run - no files were written')
      }

      // Show next steps
      logger.newLine()
      logger.info(`Output directory: ${styled.path(config.output)}`)
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error))
      if (options.verbose && error instanceof Error && error.stack) {
        logger.log(styled.dim(error.stack))
      }
      process.exit(1)
    }
  })
