/**
 * @opengenerator/cli
 *
 * Command-line interface for OpenGenerator
 */

import { Command } from 'commander'

import { initCommand } from './commands/init'
import { generateCommand } from './commands/generate'
import { watchCommand } from './commands/watch'
import { validateCommand } from './commands/validate'
import { infoCommand } from './commands/info'
import { logger } from './utils/logger'
import { checkForUpdates } from './utils/update-check'

const program = new Command()

// Package info
const packageJson = {
  name: 'opengenerator',
  version: '1.0.0',
  description: 'Schema-to-API code generator - CRUD, auth, validation, docs, deployment - all ready',
}

program
  .name('opengenerator')
  .description(packageJson.description)
  .version(packageJson.version, '-v, --version', 'Output the current version')
  .hook('preAction', async () => {
    // Check for updates
    await checkForUpdates(packageJson.name, packageJson.version)
  })

// Register commands
program.addCommand(initCommand)
program.addCommand(generateCommand)
program.addCommand(watchCommand)
program.addCommand(validateCommand)
program.addCommand(infoCommand)

// Default action - show help
program.action(() => {
  program.help()
})

// Error handling
program.showHelpAfterError('(add --help for additional information)')

// Parse arguments
program.parseAsync(process.argv).catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})

export { program }
