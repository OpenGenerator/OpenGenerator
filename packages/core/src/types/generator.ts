import type { SchemaIR } from './schema'

/**
 * Generator plugin interface
 * Generators produce API code from SchemaIR
 */
export interface GeneratorPlugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** API style this generator produces */
  style: ApiStyle
  /** Generator priority (higher runs first) */
  priority?: number

  /**
   * Generate code from SchemaIR
   * @param schema - Parsed schema
   * @param options - Generator options
   */
  generate(schema: SchemaIR, options: GeneratorOptions): Promise<GeneratedCode>

  /**
   * Get required dependencies for generated code
   */
  getDependencies(): Dependency[]

  /**
   * Get peer dependencies
   */
  getPeerDependencies?(): Dependency[]

  /**
   * Post-process generated files
   */
  postProcess?(files: GeneratedFile[]): Promise<GeneratedFile[]>
}

/**
 * API style types
 */
export type ApiStyle = 'rest' | 'graphql' | 'trpc'

/**
 * Generator options
 */
export interface GeneratorOptions {
  /** Output directory */
  output: string
  /** Schema file path */
  schema: string
  /** Generate TypeScript */
  typescript?: boolean
  /** TypeScript strict mode */
  strict?: boolean
  /** REST-specific options */
  rest?: RestOptions
  /** GraphQL-specific options */
  graphql?: GraphQLOptions
  /** tRPC-specific options */
  trpc?: TrpcOptions
  /** Code style options */
  codeStyle?: CodeStyleOptions
  /** Feature flags */
  features?: FeatureFlags
  /** Custom options */
  custom?: Record<string, unknown>
}

/**
 * REST generator options
 */
export interface RestOptions {
  /** API prefix (e.g., /api/v1) */
  prefix?: string
  /** Enable API versioning */
  versioning?: boolean
  /** API version */
  version?: string
  /** Pagination config */
  pagination?: PaginationOptions
  /** Enable sorting */
  sorting?: boolean
  /** Enable filtering */
  filtering?: boolean
  /** Response format */
  responseFormat?: 'envelope' | 'direct'
  /** Generate OpenAPI spec */
  openapi?: boolean
  /** OpenAPI spec options */
  openapiOptions?: OpenApiOptions
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Pagination style */
  style?: 'offset' | 'cursor'
  /** Default page size */
  defaultLimit?: number
  /** Maximum page size */
  maxLimit?: number
  /** Parameter names */
  params?: {
    limit?: string
    offset?: string
    cursor?: string
    page?: string
  }
}

/**
 * OpenAPI spec options
 */
export interface OpenApiOptions {
  /** OpenAPI version */
  version?: '3.0.0' | '3.1.0'
  /** API title */
  title?: string
  /** API description */
  description?: string
  /** API version */
  apiVersion?: string
  /** Server URLs */
  servers?: Array<{ url: string; description?: string }>
  /** Contact info */
  contact?: {
    name?: string
    email?: string
    url?: string
  }
  /** License info */
  license?: {
    name: string
    url?: string
  }
}

/**
 * GraphQL generator options
 */
export interface GraphQLOptions {
  /** GraphQL endpoint path */
  path?: string
  /** Enable GraphQL playground */
  playground?: boolean
  /** Enable subscriptions */
  subscriptions?: boolean
  /** Subscription transport */
  subscriptionTransport?: 'ws' | 'sse'
  /** Enable federation */
  federation?: boolean
  /** Complexity limit */
  complexity?: {
    enabled?: boolean
    maxComplexity?: number
    defaultFieldComplexity?: number
  }
  /** Depth limit */
  depthLimit?: number
}

/**
 * tRPC generator options
 */
export interface TrpcOptions {
  /** Base path for tRPC endpoint */
  basePath?: string
  /** Enable batching */
  batching?: boolean
  /** Enable SSE for subscriptions */
  sse?: boolean
  /** Enable WebSocket for subscriptions */
  ws?: boolean
}

/**
 * Code style options
 */
export interface CodeStyleOptions {
  /** Use semicolons */
  semicolons?: boolean
  /** Quote style */
  quotes?: 'single' | 'double'
  /** Indentation */
  indent?: 'tabs' | 'spaces'
  /** Indent size (for spaces) */
  indentSize?: number
  /** Trailing commas */
  trailingCommas?: 'none' | 'es5' | 'all'
  /** Print width */
  printWidth?: number
}

/**
 * Feature flags
 */
export interface FeatureFlags {
  /** Generate Swagger/OpenAPI docs */
  swagger?: boolean
  /** Enable CORS */
  cors?: boolean
  /** Rate limiting */
  rateLimit?: RateLimitOptions | boolean
  /** Logging */
  logging?: LoggingOptions | boolean
  /** Request validation */
  validation?: boolean
  /** Error handling */
  errorHandling?: boolean
  /** Health check endpoint */
  healthCheck?: boolean
  /** Metrics endpoint */
  metrics?: boolean
  /** Response caching */
  caching?: CachingOptions | boolean
  /** Compression */
  compression?: boolean
}

/**
 * Rate limit options
 */
export interface RateLimitOptions {
  /** Max requests */
  max?: number
  /** Time window in ms */
  windowMs?: number
  /** Error message */
  message?: string
}

/**
 * Logging options
 */
export interface LoggingOptions {
  /** Log level */
  level?: 'debug' | 'info' | 'warn' | 'error'
  /** Log format */
  format?: 'json' | 'pretty'
  /** Include request body */
  includeBody?: boolean
  /** Include response body */
  includeResponse?: boolean
}

/**
 * Caching options
 */
export interface CachingOptions {
  /** Cache TTL in seconds */
  ttl?: number
  /** Cache store */
  store?: 'memory' | 'redis'
  /** Cache key prefix */
  prefix?: string
}

/**
 * Generated code output
 */
export interface GeneratedCode {
  /** Generated files */
  files: GeneratedFile[]
  /** Required dependencies */
  dependencies: Dependency[]
  /** Optional metadata about the generated code */
  metadata?: Record<string, unknown>
}

/**
 * Generated file
 */
export interface GeneratedFile {
  /** Relative file path */
  path: string
  /** File content */
  content: string
  /** File type for categorization */
  type?: 'source' | 'config' | 'test' | 'migration' | 'schema' | 'documentation'
  /** Overwrite existing file */
  overwrite?: boolean
  /** File encoding */
  encoding?: BufferEncoding
  /** File permissions */
  mode?: number
}

/**
 * Package dependency
 */
export interface Dependency {
  /** Package name */
  name: string
  /** Version range */
  version: string
  /** Dependency type */
  type?: 'dependencies' | 'devDependencies' | 'peerDependencies'
  /** Shorthand for devDependencies */
  dev?: boolean
}

/**
 * Generator factory function type
 */
export type GeneratorFactory<T extends GeneratorOptions = GeneratorOptions> = (
  options?: Partial<T>
) => GeneratorPlugin

/**
 * Create a base generator plugin
 */
export function createGeneratorPlugin(config: {
  name: string
  version: string
  style: ApiStyle
  generate: GeneratorPlugin['generate']
  getDependencies: GeneratorPlugin['getDependencies']
  getPeerDependencies?: GeneratorPlugin['getPeerDependencies']
  postProcess?: GeneratorPlugin['postProcess']
  priority?: number
}): GeneratorPlugin {
  return {
    name: config.name,
    version: config.version,
    style: config.style,
    priority: config.priority ?? 0,
    generate: config.generate,
    getDependencies: config.getDependencies,
    getPeerDependencies: config.getPeerDependencies,
    postProcess: config.postProcess,
  }
}

/**
 * Merge generated code objects with file deduplication
 * When files have the same path, later files take precedence (can be merged with strategy)
 */
export function mergeGeneratedCode(
  a: GeneratedCode,
  b: GeneratedCode,
  options: { fileStrategy?: 'last-wins' | 'first-wins' | 'error' } = {}
): GeneratedCode {
  const { fileStrategy = 'last-wins' } = options
  const fileMap = new Map<string, GeneratedFile>()

  // Process files from both sources
  const allFiles = [...a.files, ...b.files]

  for (const file of allFiles) {
    const existing = fileMap.get(file.path)
    if (existing) {
      if (fileStrategy === 'error') {
        throw new Error(`File conflict: ${file.path} is generated by multiple plugins`)
      } else if (fileStrategy === 'last-wins') {
        fileMap.set(file.path, file)
      }
      // 'first-wins' - keep existing, do nothing
    } else {
      fileMap.set(file.path, file)
    }
  }

  return {
    files: Array.from(fileMap.values()),
    dependencies: mergeDependencies(a.dependencies, b.dependencies),
  }
}

/**
 * Parse semver version string to comparable parts
 */
function parseSemver(version: string): { major: number; minor: number; patch: number; prerelease?: string } {
  // Remove leading ^ or ~
  const cleaned = version.replace(/^[\^~>=<]+/, '')
  const [main, prerelease] = cleaned.split('-')
  const parts = (main ?? '0.0.0').split('.').map((p) => parseInt(p) || 0)

  return {
    major: parts[0] ?? 0,
    minor: parts[1] ?? 0,
    patch: parts[2] ?? 0,
    prerelease,
  }
}

/**
 * Compare two semver versions
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareSemver(a: string, b: string): number {
  const verA = parseSemver(a)
  const verB = parseSemver(b)

  // Compare major.minor.patch
  if (verA.major !== verB.major) return verA.major > verB.major ? 1 : -1
  if (verA.minor !== verB.minor) return verA.minor > verB.minor ? 1 : -1
  if (verA.patch !== verB.patch) return verA.patch > verB.patch ? 1 : -1

  // Pre-release versions are lower than release versions
  if (verA.prerelease && !verB.prerelease) return -1
  if (!verA.prerelease && verB.prerelease) return 1

  return 0
}

/**
 * Merge dependencies with proper semver conflict resolution
 */
export function mergeDependencies(a: Dependency[], b: Dependency[]): Dependency[] {
  const merged = new Map<string, Dependency>()

  for (const dep of [...a, ...b]) {
    const existing = merged.get(dep.name)
    if (existing) {
      // Use semver comparison - prefer higher version
      const comparison = compareSemver(dep.version, existing.version)
      if (comparison > 0) {
        merged.set(dep.name, dep)
      }
      // Also merge dev flag - if either is dev:false, result is dev:false
      if (existing.dev === false || dep.dev === false) {
        const current = merged.get(dep.name)!
        merged.set(dep.name, { ...current, dev: false })
      }
    } else {
      merged.set(dep.name, dep)
    }
  }

  return Array.from(merged.values())
}
