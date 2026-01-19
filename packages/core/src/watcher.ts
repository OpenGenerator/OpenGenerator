import { watch as chokidarWatch, type FSWatcher } from 'chokidar'
import { resolve, dirname } from 'node:path'
import { existsSync } from 'node:fs'

import type { OpenGenerator, GenerateOptions } from './generator'
import type { GeneratedCode } from './types'

/**
 * Watcher event types
 */
export type WatcherEvent = 'change' | 'add' | 'unlink' | 'error' | 'ready'

/**
 * Watcher event handler
 */
export type WatcherEventHandler = (event: WatcherEvent, path?: string, error?: Error) => void

/**
 * Watcher options
 */
export interface WatcherOptions {
  /** Debounce delay in ms */
  debounce?: number
  /** Additional paths to watch */
  additionalPaths?: string[]
  /** Paths to ignore */
  ignored?: string[]
  /** Use polling (for network drives) */
  usePolling?: boolean
  /** Polling interval */
  pollInterval?: number
  /** Persistent mode */
  persistent?: boolean
  /** Ignore initial add events */
  ignoreInitial?: boolean
  /** Await write finish */
  awaitWriteFinish?: boolean | { stabilityThreshold?: number; pollInterval?: number }
}

/**
 * File watcher for incremental builds
 */
export class Watcher {
  private generator: OpenGenerator
  private options: GenerateOptions
  private watcherOptions: WatcherOptions
  private fsWatcher?: FSWatcher
  private debounceTimer?: NodeJS.Timeout
  private isGenerating = false
  private eventHandlers: WatcherEventHandler[] = []
  private lastGeneratedCode?: GeneratedCode

  constructor(
    generator: OpenGenerator,
    options: GenerateOptions,
    watcherOptions: WatcherOptions = {}
  ) {
    this.generator = generator
    this.options = options
    this.watcherOptions = {
      debounce: 300,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
      ...watcherOptions,
    }
  }

  /**
   * Start watching
   */
  async start(): Promise<void> {
    const paths = this.getWatchPaths()

    this.fsWatcher = chokidarWatch(paths, {
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        ...(this.watcherOptions.ignored ?? []),
      ],
      persistent: this.watcherOptions.persistent,
      ignoreInitial: this.watcherOptions.ignoreInitial,
      usePolling: this.watcherOptions.usePolling,
      interval: this.watcherOptions.pollInterval,
      awaitWriteFinish: this.watcherOptions.awaitWriteFinish,
    })

    this.fsWatcher
      .on('change', (path) => this.handleEvent('change', path))
      .on('add', (path) => this.handleEvent('add', path))
      .on('unlink', (path) => this.handleEvent('unlink', path))
      .on('error', (error) => this.handleEvent('error', undefined, error))
      .on('ready', () => this.handleEvent('ready'))

    // Initial generation
    await this.regenerate()
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    if (this.fsWatcher) {
      await this.fsWatcher.close()
      this.fsWatcher = undefined
    }
  }

  /**
   * Add event handler
   */
  on(handler: WatcherEventHandler): this {
    this.eventHandlers.push(handler)
    return this
  }

  /**
   * Remove event handler
   */
  off(handler: WatcherEventHandler): this {
    const index = this.eventHandlers.indexOf(handler)
    if (index !== -1) {
      this.eventHandlers.splice(index, 1)
    }
    return this
  }

  /**
   * Get the last generated code
   */
  getLastGeneratedCode(): GeneratedCode | undefined {
    return this.lastGeneratedCode
  }

  /**
   * Check if currently generating
   */
  isCurrentlyGenerating(): boolean {
    return this.isGenerating
  }

  /**
   * Get watch paths
   */
  private getWatchPaths(): string[] {
    const paths: string[] = []

    // Add schema file/directory
    const schemaPath = resolve(this.options.schema)
    if (existsSync(schemaPath)) {
      paths.push(schemaPath)
    } else {
      // Watch the directory where schema should be
      paths.push(dirname(schemaPath))
    }

    // Add additional paths
    if (this.watcherOptions.additionalPaths) {
      paths.push(...this.watcherOptions.additionalPaths.map((p) => resolve(p)))
    }

    return paths
  }

  /**
   * Handle file system event
   */
  private handleEvent(event: WatcherEvent, path?: string, error?: Error): void {
    // Emit event to handlers
    for (const handler of this.eventHandlers) {
      try {
        handler(event, path, error)
      } catch (handlerError) {
        console.error('Watcher event handler error:', handlerError)
      }
    }

    // Trigger regeneration on file changes
    if (event === 'change' || event === 'add') {
      this.debouncedRegenerate()
    }
  }

  /**
   * Debounced regeneration
   */
  private debouncedRegenerate(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      void this.regenerate()
    }, this.watcherOptions.debounce)
  }

  /**
   * Regenerate code
   */
  private async regenerate(): Promise<void> {
    if (this.isGenerating) {
      // Queue another regeneration after current one finishes
      this.debouncedRegenerate()
      return
    }

    this.isGenerating = true

    try {
      console.log('\n[watcher] Changes detected, regenerating...')
      const startTime = Date.now()

      this.lastGeneratedCode = await this.generator.generate(this.options)

      const duration = Date.now() - startTime
      console.log(`[watcher] Generation complete in ${duration}ms`)
      console.log(`[watcher] Generated ${this.lastGeneratedCode.files.length} files`)
    } catch (error) {
      console.error('[watcher] Generation failed:', error)
      this.handleEvent('error', undefined, error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.isGenerating = false
    }
  }
}

/**
 * Create a file watcher
 */
export function createWatcher(
  generator: OpenGenerator,
  options: GenerateOptions,
  watcherOptions?: WatcherOptions
): Watcher {
  return new Watcher(generator, options, watcherOptions)
}
