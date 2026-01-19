import { Command } from 'commander'

import { loadConfig } from '@opengenerator/core'

import { logger, styled } from '../utils/logger'

/**
 * Validate command
 */
export const validateCommand = new Command('validate')
  .description('Validate schema and configuration')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-s, --schema <path>', 'Path to schema file (overrides config)')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
    let hasErrors = false

    try {
      // Load and validate configuration
      logger.info('Validating configuration...')

      try {
        const { config, filepath, isEmpty } = await loadConfig(options.config)

        if (isEmpty) {
          logger.warn('No configuration file found, using defaults')
        } else {
          logger.success(`Configuration valid: ${styled.path(filepath ?? 'inline')}`)
        }

        // Show config summary if verbose
        if (options.verbose) {
          logger.newLine()
          logger.log('Configuration:')
          logger.log(JSON.stringify(config, null, 2))
        }
      } catch (error) {
        logger.error(`Configuration invalid: ${(error as Error).message}`)
        hasErrors = true
      }

      // Validate schema file exists
      logger.newLine()
      logger.info('Validating schema...')

      const schemaPath = options.schema ?? './prisma/schema.prisma'

      try {
        const fs = await import('node:fs/promises')
        await fs.access(schemaPath)
        logger.success(`Schema file found: ${styled.path(schemaPath)}`)

        // TODO: Add actual schema validation using parser plugins
        // For now, just check if file exists and is readable
        const content = await fs.readFile(schemaPath, 'utf-8')
        logger.success(`Schema readable: ${content.length} bytes`)

        if (options.verbose) {
          logger.newLine()
          logger.log('Schema preview (first 500 chars):')
          logger.log(styled.dim(content.slice(0, 500) + (content.length > 500 ? '...' : '')))
        }
      } catch (error) {
        logger.error(`Schema file not found: ${styled.path(schemaPath)}`)
        hasErrors = true
      }

      // Summary
      logger.newLine()
      if (hasErrors) {
        logger.error('Validation failed')
        process.exit(1)
      } else {
        logger.success('All validations passed')
      }
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })
