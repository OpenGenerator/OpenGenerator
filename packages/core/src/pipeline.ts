import type { SchemaIR, GeneratedCode, GeneratedFile } from './types'
import type { OpenGenerator, GenerateOptions } from './generator'

/**
 * Pipeline stage type
 */
export type PipelineStage =
  | 'parse'
  | 'validate'
  | 'transform'
  | 'generate'
  | 'adapt'
  | 'auth'
  | 'database'
  | 'deploy'
  | 'postProcess'
  | 'write'

/**
 * Pipeline event
 */
export interface PipelineEvent {
  stage: PipelineStage
  status: 'start' | 'complete' | 'error'
  data?: unknown
  error?: Error
  timestamp: number
}

/**
 * Pipeline hook function
 */
export type PipelineHook = (event: PipelineEvent) => void | Promise<void>

/**
 * Schema transformation function
 */
export type SchemaTransform = (schema: SchemaIR) => SchemaIR | Promise<SchemaIR>

/**
 * Code transformation function
 */
export type CodeTransform = (code: GeneratedCode) => GeneratedCode | Promise<GeneratedCode>

/**
 * File filter function
 */
export type FileFilter = (file: GeneratedFile) => boolean

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Schema transformations to apply after parsing */
  schemaTransforms?: SchemaTransform[]
  /** Code transformations to apply before writing */
  codeTransforms?: CodeTransform[]
  /** File filters to exclude certain files */
  fileFilters?: FileFilter[]
  /** Pipeline hooks for monitoring */
  hooks?: {
    onStageStart?: PipelineHook
    onStageComplete?: PipelineHook
    onStageError?: PipelineHook
  }
  /** Enable parallel processing where possible */
  parallel?: boolean
  /** Maximum concurrency for parallel operations */
  maxConcurrency?: number
}

/**
 * Pipeline result
 */
export interface PipelineResult {
  /** Generated code */
  code: GeneratedCode
  /** Parsed schema */
  schema: SchemaIR
  /** Pipeline execution time in ms */
  duration: number
  /** Stage timings */
  stageTimes: Record<PipelineStage, number>
  /** Warnings collected during pipeline */
  warnings: string[]
}

/**
 * Generation pipeline
 *
 * Manages the full code generation process with hooks,
 * transformations, and parallel processing support.
 */
export class Pipeline {
  private generator: OpenGenerator
  private config: PipelineConfig
  private warnings: string[] = []
  private stageTimes: Partial<Record<PipelineStage, number>> = {}

  constructor(generator: OpenGenerator, config: PipelineConfig = {}) {
    this.generator = generator
    this.config = config
  }

  /**
   * Run the full generation pipeline
   */
  async run(options: GenerateOptions): Promise<PipelineResult> {
    const startTime = Date.now()
    this.warnings = []
    this.stageTimes = {}

    // Stage 1: Parse
    let schema = await this.runStage('parse', async () => {
      return this.generator.parse(options.schema)
    })

    // Stage 2: Validate
    await this.runStage('validate', async () => {
      const validation = this.generator.validate()
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }
      this.warnings.push(...validation.warnings)
    })

    // Stage 3: Transform schema
    schema = await this.runStage('transform', async () => {
      let transformed = schema
      for (const transform of this.config.schemaTransforms ?? []) {
        transformed = await transform(transformed)
      }
      return transformed
    })

    // Stage 4-8: Generate code
    let code = await this.runStage('generate', async () => {
      return this.generator.generate({
        ...options,
        write: false, // We'll handle writing in the pipeline
      })
    })

    // Stage 9: Post-process
    code = await this.runStage('postProcess', async () => {
      let processed = code

      // Apply code transformations
      for (const transform of this.config.codeTransforms ?? []) {
        processed = await transform(processed)
      }

      // Apply file filters
      if (this.config.fileFilters?.length) {
        processed = {
          ...processed,
          files: processed.files.filter((file) =>
            this.config.fileFilters!.every((filter) => filter(file))
          ),
        }
      }

      return processed
    })

    // Stage 10: Write
    if (options.write !== false && !options.dryRun) {
      await this.runStage('write', async () => {
        const { writeGeneratedCode } = await import('./emitter')
        await writeGeneratedCode(code, options.output)
      })
    }

    return {
      code,
      schema,
      duration: Date.now() - startTime,
      stageTimes: this.stageTimes as Record<PipelineStage, number>,
      warnings: this.warnings,
    }
  }

  /**
   * Run a pipeline stage with hooks and timing
   */
  private async runStage<T>(stage: PipelineStage, fn: () => Promise<T>): Promise<T> {
    const stageStart = Date.now()

    // Emit start event
    await this.emitEvent({
      stage,
      status: 'start',
      timestamp: stageStart,
    })

    try {
      const result = await fn()

      const stageEnd = Date.now()
      this.stageTimes[stage] = stageEnd - stageStart

      // Emit complete event
      await this.emitEvent({
        stage,
        status: 'complete',
        data: result,
        timestamp: stageEnd,
      })

      return result
    } catch (error) {
      const stageEnd = Date.now()
      this.stageTimes[stage] = stageEnd - stageStart

      // Emit error event
      await this.emitEvent({
        stage,
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
        timestamp: stageEnd,
      })

      throw error
    }
  }

  /**
   * Emit a pipeline event to hooks
   */
  private async emitEvent(event: PipelineEvent): Promise<void> {
    const { hooks } = this.config

    if (!hooks) return

    try {
      switch (event.status) {
        case 'start':
          await hooks.onStageStart?.(event)
          break
        case 'complete':
          await hooks.onStageComplete?.(event)
          break
        case 'error':
          await hooks.onStageError?.(event)
          break
      }
    } catch (hookError) {
      // Log but don't fail on hook errors
      console.warn('Pipeline hook error:', hookError)
    }
  }
}

/**
 * Create a new pipeline
 */
export function createPipeline(generator: OpenGenerator, config?: PipelineConfig): Pipeline {
  return new Pipeline(generator, config)
}

/**
 * Common schema transformations
 */
export const schemaTransforms = {
  /**
   * Add timestamps to all models
   */
  addTimestamps: (): SchemaTransform => (schema) => ({
    ...schema,
    models: schema.models.map((model) => ({
      ...model,
      timestamps: true,
    })),
  }),

  /**
   * Add soft delete to all models
   */
  addSoftDelete: (): SchemaTransform => (schema) => ({
    ...schema,
    models: schema.models.map((model) => ({
      ...model,
      softDelete: true,
    })),
  }),

  /**
   * Filter models by name
   */
  filterModels: (names: string[]): SchemaTransform => (schema) => ({
    ...schema,
    models: schema.models.filter((m) => names.includes(m.name)),
  }),

  /**
   * Exclude models by name
   */
  excludeModels: (names: string[]): SchemaTransform => (schema) => ({
    ...schema,
    models: schema.models.filter((m) => !names.includes(m.name)),
  }),

  /**
   * Add auth to all models
   */
  requireAuth: (): SchemaTransform => (schema) => ({
    ...schema,
    models: schema.models.map((model) => ({
      ...model,
      auth: {
        required: true,
        ...model.auth,
      },
    })),
  }),
}

/**
 * Common code transformations
 */
export const codeTransforms = {
  /**
   * Add a banner comment to all files
   */
  addBanner: (banner: string): CodeTransform => (code) => ({
    ...code,
    files: code.files.map((file) => ({
      ...file,
      content: `${banner}\n\n${file.content}`,
    })),
  }),

  /**
   * Filter files by extension
   */
  filterByExtension: (extensions: string[]): CodeTransform => (code) => ({
    ...code,
    files: code.files.filter((file) =>
      extensions.some((ext) => file.path.endsWith(ext))
    ),
  }),

  /**
   * Exclude files by path pattern
   */
  excludeByPattern: (pattern: RegExp): CodeTransform => (code) => ({
    ...code,
    files: code.files.filter((file) => !pattern.test(file.path)),
  }),
}
