import chalk from 'chalk'
import figures from 'figures'

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

/**
 * Logger options
 */
export interface LoggerOptions {
  level?: LogLevel
  silent?: boolean
  prefix?: string
}

/**
 * CLI Logger
 */
class Logger {
  private options: LoggerOptions = {
    level: 'info',
    silent: false,
  }

  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    success: 1,
    warn: 2,
    error: 3,
  }

  /**
   * Configure logger
   */
  configure(options: LoggerOptions): void {
    this.options = { ...this.options, ...options }
  }

  /**
   * Check if a level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.options.silent) return false
    const currentPriority = this.levelPriority[this.options.level ?? 'info']
    const messagePriority = this.levelPriority[level]
    return messagePriority >= currentPriority
  }

  /**
   * Format a message with optional prefix
   */
  private format(message: string): string {
    if (this.options.prefix) {
      return `${this.options.prefix} ${message}`
    }
    return message
  }

  /**
   * Log a debug message
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.log(chalk.gray(`${figures.pointer} ${this.format(message)}`), ...args)
    }
  }

  /**
   * Log an info message
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(chalk.blue(`${figures.info} ${this.format(message)}`), ...args)
    }
  }

  /**
   * Log a success message
   */
  success(message: string, ...args: unknown[]): void {
    if (this.shouldLog('success')) {
      console.log(chalk.green(`${figures.tick} ${this.format(message)}`), ...args)
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.log(chalk.yellow(`${figures.warning} ${this.format(message)}`), ...args)
    }
  }

  /**
   * Log an error message
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(chalk.red(`${figures.cross} ${this.format(message)}`), ...args)
    }
  }

  /**
   * Log a plain message (no formatting)
   */
  log(message: string, ...args: unknown[]): void {
    if (!this.options.silent) {
      console.log(message, ...args)
    }
  }

  /**
   * Log an empty line
   */
  newLine(): void {
    if (!this.options.silent) {
      console.log()
    }
  }

  /**
   * Log a title/header
   */
  title(message: string): void {
    if (!this.options.silent) {
      console.log()
      console.log(chalk.bold.underline(message))
      console.log()
    }
  }

  /**
   * Log a list item
   */
  list(items: string[]): void {
    if (!this.options.silent) {
      for (const item of items) {
        console.log(`  ${chalk.dim(figures.pointer)} ${item}`)
      }
    }
  }

  /**
   * Log a table
   */
  table(data: Array<Record<string, unknown>>): void {
    if (!this.options.silent) {
      console.table(data)
    }
  }

  /**
   * Create a child logger with a prefix
   */
  child(prefix: string): Logger {
    const child = new Logger()
    child.configure({
      ...this.options,
      prefix: this.options.prefix ? `${this.options.prefix}:${prefix}` : prefix,
    })
    return child
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger()

/**
 * Styled text helpers
 */
export const styled = {
  bold: chalk.bold,
  dim: chalk.dim,
  italic: chalk.italic,
  underline: chalk.underline,

  // Colors
  blue: chalk.blue,
  green: chalk.green,
  yellow: chalk.yellow,
  red: chalk.red,
  cyan: chalk.cyan,
  magenta: chalk.magenta,
  gray: chalk.gray,

  // Semantic
  primary: chalk.blue,
  secondary: chalk.gray,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  info: chalk.cyan,

  // Code
  code: chalk.cyan,
  path: chalk.yellow,
  command: chalk.green.bold,
}
