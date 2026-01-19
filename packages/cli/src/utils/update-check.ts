import updateNotifier from 'update-notifier'
import boxen from 'boxen'
import chalk from 'chalk'

/**
 * Check for package updates
 */
export async function checkForUpdates(
  packageName: string,
  currentVersion: string
): Promise<void> {
  try {
    const notifier = updateNotifier({
      pkg: {
        name: packageName,
        version: currentVersion,
      },
      updateCheckInterval: 1000 * 60 * 60 * 24, // 1 day
    })

    // Only show notification if update is available
    if (notifier.update && notifier.update.latest !== currentVersion) {
      const message = boxen(
        `Update available: ${chalk.dim(currentVersion)} → ${chalk.green(notifier.update.latest)}\n` +
        `Run ${chalk.cyan(`npm install -g ${packageName}`)} to update`,
        {
          padding: 1,
          margin: 1,
          borderColor: 'yellow',
          borderStyle: 'round',
        }
      )

      console.log(message)
    }
  } catch {
    // Silently ignore update check errors
  }
}
