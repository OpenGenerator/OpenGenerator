import { Command } from 'commander'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

import { loadConfig, globalRegistry } from '@opengenerator/core'

import { logger, styled } from '../utils/logger'

/**
 * Info command
 */
export const infoCommand = new Command('info')
  .description('Show project and environment information')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('--plugins', 'Show installed plugins')
  .option('--schema', 'Show schema information')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const info: Record<string, unknown> = {}

    // Environment info
    info.environment = {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cwd: process.cwd(),
    }

    // Package versions
    try {
      const coreVersion = await getPackageVersion('@opengenerator/core')
      const cliVersion = await getPackageVersion('@opengenerator/cli')

      info.packages = {
        core: coreVersion,
        cli: cliVersion,
      }
    } catch {
      info.packages = { error: 'Unable to determine package versions' }
    }

    // Configuration
    try {
      const { config, filepath, isEmpty } = await loadConfig(options.config)
      info.config = {
        path: filepath ?? 'none',
        isEmpty,
        schema: config.schema,
        output: config.output,
        adapter: config.adapter,
        apiStyles: Object.keys(config.api ?? {}).filter(
          (key) => (config.api as Record<string, unknown>)?.[key]
        ),
        authStrategies: config.auth?.strategies ?? [],
        database: config.database?.adapter,
        deployTargets: config.deploy ?? [],
      }
    } catch (error) {
      info.config = {
        error: (error as Error).message,
      }
    }

    // Plugins
    if (options.plugins) {
      const plugins = globalRegistry.getAll()
      info.plugins = {
        total: plugins.length,
        items: plugins.map((p) => ({
          name: p.metadata.name,
          version: p.metadata.version,
          type: p.metadata.type,
        })),
      }
    }

    // Schema info
    if (options.schema) {
      try {
        const { config } = await loadConfig(options.config)
        const schemaPath = resolve(config.schema)

        if (existsSync(schemaPath)) {
          const content = await readFile(schemaPath, 'utf-8')
          const stats = await import('node:fs').then((fs) =>
            fs.promises.stat(schemaPath)
          )

          info.schema = {
            path: schemaPath,
            size: stats.size,
            lines: content.split('\n').length,
            modified: stats.mtime.toISOString(),
          }

          // Try to extract model count (simple heuristic)
          const modelMatches = content.match(/^model\s+\w+/gm)
          if (modelMatches) {
            (info.schema as Record<string, unknown>).models = modelMatches.length
          }
        } else {
          info.schema = { error: 'Schema file not found' }
        }
      } catch (error) {
        info.schema = { error: (error as Error).message }
      }
    }

    // Output
    if (options.json) {
      console.log(JSON.stringify(info, null, 2))
    } else {
      printInfo(info)
    }
  })

/**
 * Get package version from node_modules
 */
async function getPackageVersion(packageName: string): Promise<string> {
  try {
    // Try to resolve package.json
    const possiblePaths = [
      join('node_modules', packageName, 'package.json'),
      join('..', 'node_modules', packageName, 'package.json'),
      join('..', '..', 'node_modules', packageName, 'package.json'),
    ]

    for (const path of possiblePaths) {
      const resolved = resolve(path)
      if (existsSync(resolved)) {
        const content = await readFile(resolved, 'utf-8')
        const pkg = JSON.parse(content) as { version: string }
        return pkg.version
      }
    }

    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * Print info in a formatted way
 */
function printInfo(info: Record<string, unknown>): void {
  logger.title('OpenGenerator Info')

  // Environment
  const env = info.environment as Record<string, string>
  logger.log(styled.bold('Environment:'))
  logger.log(`  Node.js: ${styled.cyan(env.node)}`)
  logger.log(`  Platform: ${env.platform} (${env.arch})`)
  logger.log(`  Working Directory: ${styled.path(env.cwd)}`)

  // Packages
  logger.newLine()
  const packages = info.packages as Record<string, string>
  logger.log(styled.bold('Packages:'))
  if (packages.error) {
    logger.log(`  ${styled.red(packages.error)}`)
  } else {
    logger.log(`  @opengenerator/core: ${styled.cyan(packages.core)}`)
    logger.log(`  @opengenerator/cli: ${styled.cyan(packages.cli)}`)
  }

  // Configuration
  logger.newLine()
  const config = info.config as Record<string, unknown>
  logger.log(styled.bold('Configuration:'))
  if (config.error) {
    logger.log(`  ${styled.red(config.error as string)}`)
  } else {
    logger.log(`  Config File: ${config.path ? styled.path(config.path as string) : styled.dim('none')}`)
    logger.log(`  Schema: ${styled.path(config.schema as string)}`)
    logger.log(`  Output: ${styled.path(config.output as string)}`)
    logger.log(`  Adapter: ${styled.cyan((config.adapter as string) ?? 'none')}`)
    logger.log(`  API Styles: ${(config.apiStyles as string[]).join(', ') || 'none'}`)
    logger.log(`  Auth: ${(config.authStrategies as string[]).join(', ') || 'none'}`)
    logger.log(`  Database: ${styled.cyan((config.database as string) ?? 'none')}`)
    logger.log(`  Deploy: ${(config.deployTargets as string[]).join(', ') || 'none'}`)
  }

  // Plugins
  if (info.plugins) {
    logger.newLine()
    const plugins = info.plugins as { total: number; items: Array<{ name: string; version: string; type: string }> }
    logger.log(styled.bold(`Plugins (${plugins.total}):`))
    if (plugins.items.length === 0) {
      logger.log(`  ${styled.dim('No plugins registered')}`)
    } else {
      for (const plugin of plugins.items) {
        logger.log(`  ${plugin.name}@${plugin.version} (${plugin.type})`)
      }
    }
  }

  // Schema
  if (info.schema) {
    logger.newLine()
    const schema = info.schema as Record<string, unknown>
    logger.log(styled.bold('Schema:'))
    if (schema.error) {
      logger.log(`  ${styled.red(schema.error as string)}`)
    } else {
      logger.log(`  Path: ${styled.path(schema.path as string)}`)
      logger.log(`  Size: ${schema.size} bytes`)
      logger.log(`  Lines: ${schema.lines}`)
      if (schema.models) {
        logger.log(`  Models: ${schema.models}`)
      }
      logger.log(`  Modified: ${schema.modified}`)
    }
  }

  logger.newLine()
}
