import type { SchemaIR } from './schema'

/**
 * Parser plugin interface
 * Parsers convert source schemas to SchemaIR
 */
export interface ParserPlugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** File extensions this parser handles */
  extensions: string[]
  /** Content types this parser handles (for detection) */
  contentTypes?: string[]

  /**
   * Check if this parser can handle the input
   * @param input - File content or path
   * @param filePath - Optional file path for extension-based detection
   */
  canParse(input: string | Buffer, filePath?: string): boolean

  /**
   * Parse input to SchemaIR
   * @param input - File content
   * @param options - Parser options
   */
  parse(input: string | Buffer, options?: ParserOptions): Promise<SchemaIR>

  /**
   * Validate input before parsing
   * @param input - File content
   */
  validate?(input: string | Buffer): ValidationResult
}

/**
 * Parser options
 */
export interface ParserOptions {
  /** File path for context */
  filePath?: string
  /** Base path for resolving relative imports */
  basePath?: string
  /** Include comments in output */
  preserveComments?: boolean
  /** Custom model transformations */
  modelTransforms?: ModelTransform[]
  /** Custom field transformations */
  fieldTransforms?: FieldTransform[]
  /** Strict mode - fail on warnings */
  strict?: boolean
  /** Custom parser-specific options */
  custom?: Record<string, unknown>
}

/**
 * Model transformation function
 */
export type ModelTransform = (modelName: string) => string | undefined

/**
 * Field transformation function
 */
export type FieldTransform = (fieldName: string, modelName: string) => string | undefined

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is the input valid */
  valid: boolean
  /** Validation errors */
  errors: ValidationError[]
  /** Validation warnings */
  warnings: ValidationWarning[]
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error message */
  message: string
  /** Error location */
  location?: SourceLocation
  /** Error code */
  code?: string
  /** Severity */
  severity: 'error'
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning message */
  message: string
  /** Warning location */
  location?: SourceLocation
  /** Warning code */
  code?: string
  /** Severity */
  severity: 'warning'
}

/**
 * Source location for error reporting
 */
export interface SourceLocation {
  /** Line number (1-based) */
  line: number
  /** Column number (1-based) */
  column: number
  /** End line (for ranges) */
  endLine?: number
  /** End column (for ranges) */
  endColumn?: number
  /** File path */
  filePath?: string
}

/**
 * Parser factory function type
 */
export type ParserFactory<T extends ParserOptions = ParserOptions> = (options?: T) => ParserPlugin

/**
 * Create a base parser plugin
 */
export function createParserPlugin(config: {
  name: string
  version: string
  extensions: string[]
  canParse: ParserPlugin['canParse']
  parse: ParserPlugin['parse']
  validate?: ParserPlugin['validate']
}): ParserPlugin {
  return {
    name: config.name,
    version: config.version,
    extensions: config.extensions,
    canParse: config.canParse,
    parse: config.parse,
    validate: config.validate,
  }
}
