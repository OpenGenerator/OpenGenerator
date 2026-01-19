import { Command } from 'commander'
import { resolve } from 'node:path'

import {
  loadConfig,
  createGenerator,
  createWatcher,
} from '@opengenerator/core'

import { logger, styled } from '../utils/logger'

/**
 * Watch command
 */
export const watchCommand = new Command('watch')
  .description('Watch for schema changes and regenerate')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-s, --schema <path>', 'Path to schema file (overrides config)')
  .option('-o, --output <path>', 'Output directory (overrides config)')
  .option('-d, --debounce <ms>', 'Debounce delay in milliseconds', '300')
  .option('--verbose', 'Show detailed output')
  .action(async (options) => {
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

      logger.info(`Watching ${styled.path(config.schema)} for changes...`)
      logger.info('Press Ctrl+C to stop')
      logger.newLine()

      // Create generator
      const generator = createGenerator()

      // TODO: Load and register plugins based on config

      // Create watcher
      const watcher = createWatcher(
        generator,
        {
          ...config,
          output: resolve(config.output),
        },
        {
          debounce: parseInt(options.debounce, 10),
        }
      )

      // Add event handlers
      watcher.on((event, path, error) => {
        const timestamp = new Date().toLocaleTimeString()

        switch (event) {
          case 'ready':
            logger.success(`[${timestamp}] Watcher ready`)
            break
          case 'change':
            logger.info(`[${timestamp}] File changed: ${styled.path(path ?? '')}`)
            break
          case 'add':
            logger.info(`[${timestamp}] File added: ${styled.path(path ?? '')}`)
            break
          case 'unlink':
            logger.warn(`[${timestamp}] File removed: ${styled.path(path ?? '')}`)
            break
          case 'error':
            logger.error(`[${timestamp}] Error: ${error?.message ?? 'Unknown error'}`)
            break
        }
      })

      // Start watching
      await watcher.start()

      // Handle shutdown
      const shutdown = async () => {
        logger.newLine()
        logger.info('Stopping watcher...')
        await watcher.stop()
        logger.success('Watcher stopped')
        process.exit(0)
      }

      process.on('SIGINT', () => void shutdown())
      process.on('SIGTERM', () => void shutdown())
    } catch (error) {
      logger.error(error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  })
