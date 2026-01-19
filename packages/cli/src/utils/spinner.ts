import ora, { type Ora } from 'ora'
import chalk from 'chalk'

/**
 * Spinner options
 */
export interface SpinnerOptions {
  text?: string
  color?: 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray'
  spinner?: 'dots' | 'line' | 'dots2' | 'dots3' | 'pipe' | 'simpleDots' | 'arc' | 'bouncingBar'
}

/**
 * Create a spinner
 */
export function createSpinner(options: SpinnerOptions = {}): Ora {
  return ora({
    text: options.text ?? 'Loading...',
    color: options.color ?? 'cyan',
    spinner: options.spinner ?? 'dots',
  })
}

/**
 * Run a task with a spinner
 */
export async function withSpinner<T>(
  task: () => Promise<T>,
  options: {
    start?: string
    success?: string
    fail?: string
  } = {}
): Promise<T> {
  const spinner = createSpinner({ text: options.start ?? 'Processing...' })
  spinner.start()

  try {
    const result = await task()
    spinner.succeed(options.success ?? 'Done!')
    return result
  } catch (error) {
    spinner.fail(options.fail ?? 'Failed!')
    throw error
  }
}

/**
 * Progress indicator for multiple steps
 */
export class Progress {
  private current = 0
  private total: number
  private spinner: Ora

  constructor(total: number, initialText?: string) {
    this.total = total
    this.spinner = createSpinner({ text: initialText ?? this.formatProgress() })
  }

  /**
   * Start the progress indicator
   */
  start(): void {
    this.spinner.start()
  }

  /**
   * Update progress
   */
  update(text?: string): void {
    this.current++
    this.spinner.text = text ?? this.formatProgress()
  }

  /**
   * Set current step
   */
  setStep(step: number, text?: string): void {
    this.current = step
    this.spinner.text = text ?? this.formatProgress()
  }

  /**
   * Complete successfully
   */
  succeed(text?: string): void {
    this.spinner.succeed(text ?? `Completed ${this.total}/${this.total}`)
  }

  /**
   * Fail with error
   */
  fail(text?: string): void {
    this.spinner.fail(text ?? `Failed at ${this.current}/${this.total}`)
  }

  /**
   * Stop without status
   */
  stop(): void {
    this.spinner.stop()
  }

  /**
   * Format progress text
   */
  private formatProgress(): string {
    const percentage = Math.round((this.current / this.total) * 100)
    const bar = this.createProgressBar(percentage)
    return `${bar} ${percentage}% (${this.current}/${this.total})`
  }

  /**
   * Create a progress bar
   */
  private createProgressBar(percentage: number): string {
    const width = 20
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    return chalk.cyan('█'.repeat(filled)) + chalk.gray('░'.repeat(empty))
  }
}

/**
 * Create a progress indicator
 */
export function createProgress(total: number, initialText?: string): Progress {
  return new Progress(total, initialText)
}
