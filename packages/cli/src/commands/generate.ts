import { Command } from 'commander'
import { resolve } from 'node:path'

import {
  loadConfig,
  createGenerator,
  createPipeline,
} from '@opengenerator/core'

import { logger, styled } from '../utils/logger'
import { createProgress } from '../utils/spinner'

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

      // Create generator
      const generator = createGenerator()

      // TODO: Load and register plugins based on config
      // For now, we'll show a placeholder

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
        schema: config.schema,
        output: resolve(config.output),
        dryRun: options.dryRun,
        ...config,
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
