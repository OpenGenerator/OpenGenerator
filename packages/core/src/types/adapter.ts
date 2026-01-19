import type { Dependency, GeneratedCode, GeneratedFile, GeneratorOptions } from './generator'

/**
 * Adapter plugin interface
 * Adapters transform generated code for specific frameworks
 */
export interface AdapterPlugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Target framework */
  framework: FrameworkType
  /** Adapter priority (higher runs first) */
  priority?: number

  /**
   * Adapt generated code for the target framework
   * @param code - Generated code from generators
   * @param options - Adapter options
   */
  adapt(code: GeneratedCode, options: AdapterOptions): Promise<GeneratedCode>

  /**
   * Get framework-specific dependencies
   */
  getDependencies(): Dependency[]

  /**
   * Get peer dependencies
   */
  getPeerDependencies?(): Dependency[]

  /**
   * Generate framework-specific entry point
   */
  generateEntryPoint?(options: AdapterOptions): GeneratedFile

  /**
   * Generate framework-specific middleware
   */
  generateMiddleware?(options: AdapterOptions): GeneratedFile[]

  /**
   * Optional generate method for adapters that generate additional code
   */
  generate?(options: AdapterOptions): Promise<GeneratedCode>
}

/**
 * Supported framework types
 */
export type FrameworkType = 'express' | 'fastify' | 'hono' | 'koa' | 'standalone'

/**
 * Adapter options
 */
export interface AdapterOptions extends GeneratorOptions {
  /** Framework-specific options */
  framework?: FrameworkOptions
  /** Server options */
  server?: ServerOptions
  /** Middleware options */
  middleware?: MiddlewareOptions
}

/**
 * Framework-specific options
 */
export interface FrameworkOptions {
  /** Express options */
  express?: ExpressOptions
  /** Fastify options */
  fastify?: FastifyOptions
  /** Hono options */
  hono?: HonoOptions
  /** Koa options */
  koa?: KoaOptions
  /** Standalone options */
  standalone?: StandaloneOptions
}

/**
 * Express-specific options
 */
export interface ExpressOptions {
  /** Enable trust proxy */
  trustProxy?: boolean
  /** Body parser limit */
  bodyLimit?: string
  /** Enable JSON body parsing */
  jsonBody?: boolean
  /** Enable URL-encoded body parsing */
  urlencodedBody?: boolean
}

/**
 * Fastify-specific options
 */
export interface FastifyOptions {
  /** Logger options */
  logger?: boolean | object
  /** Body limit */
  bodyLimit?: number
  /** Enable request ID */
  requestId?: boolean
  /** Trust proxy */
  trustProxy?: boolean
  /** Plugin timeout */
  pluginTimeout?: number
}

/**
 * Hono-specific options
 */
export interface HonoOptions {
  /** Router type */
  router?: 'smart' | 'trie' | 'pattern'
  /** Enable strict mode */
  strict?: boolean
  /** Base path */
  basePath?: string
}

/**
 * Koa-specific options
 */
export interface KoaOptions {
  /** Enable proxy headers */
  proxy?: boolean
  /** Subdomains offset */
  subdomainOffset?: number
  /** Enable signed cookies */
  keys?: string[]
}

/**
 * Standalone (Node HTTP) options
 */
export interface StandaloneOptions {
  /** HTTP/2 */
  http2?: boolean
  /** Keep-alive timeout */
  keepAliveTimeout?: number
  /** Headers timeout */
  headersTimeout?: number
}

/**
 * Server configuration options
 */
export interface ServerOptions {
  /** Server host */
  host?: string
  /** Server port */
  port?: number
  /** HTTPS options */
  https?: HttpsOptions
  /** Graceful shutdown timeout */
  shutdownTimeout?: number
  /** Enable clustering */
  cluster?: boolean
  /** Number of workers (for clustering) */
  workers?: number
}

/**
 * HTTPS options
 */
export interface HttpsOptions {
  /** Enable HTTPS */
  enabled?: boolean
  /** SSL key path */
  keyPath?: string
  /** SSL cert path */
  certPath?: string
  /** SSL CA path */
  caPath?: string
}

/**
 * Middleware configuration options
 */
export interface MiddlewareOptions {
  /** Middleware order */
  order?: string[]
  /** Enable/disable specific middleware */
  enabled?: Record<string, boolean>
  /** Middleware-specific config */
  config?: Record<string, unknown>
}

/**
 * Middleware definition
 */
export interface MiddlewareDefinition {
  /** Middleware name */
  name: string
  /** Middleware order (lower runs first) */
  order?: number
  /** Middleware code */
  code: string
  /** Required imports */
  imports?: string[]
  /** Configuration interface */
  configInterface?: string
}

/**
 * Adapter factory function type
 */
export type AdapterFactory<T extends AdapterOptions = AdapterOptions> = (
  options?: Partial<T>
) => AdapterPlugin

/**
 * Create a base adapter plugin
 */
export function createAdapterPlugin(config: {
  name: string
  version: string
  framework: FrameworkType
  adapt: AdapterPlugin['adapt']
  getDependencies: AdapterPlugin['getDependencies']
  getPeerDependencies?: AdapterPlugin['getPeerDependencies']
  generateEntryPoint?: AdapterPlugin['generateEntryPoint']
  generateMiddleware?: AdapterPlugin['generateMiddleware']
  priority?: number
}): AdapterPlugin {
  return {
    name: config.name,
    version: config.version,
    framework: config.framework,
    priority: config.priority ?? 0,
    adapt: config.adapt,
    getDependencies: config.getDependencies,
    getPeerDependencies: config.getPeerDependencies,
    generateEntryPoint: config.generateEntryPoint,
    generateMiddleware: config.generateMiddleware,
  }
}
