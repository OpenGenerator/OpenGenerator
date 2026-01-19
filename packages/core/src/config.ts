import { cosmiconfig } from 'cosmiconfig'
import { z } from 'zod'

import type {
  ApiStyle,
  AuthStrategy,
  DeployTarget,
} from './types'

/**
 * OpenGenerator configuration schema
 */
export const configSchema = z.object({
  /** Schema source file or URL */
  schema: z.string(),

  /** Output directory */
  output: z.string().default('./generated'),

  /** API styles configuration */
  api: z
    .object({
      rest: z
        .union([
          z.boolean(),
          z.object({
            enabled: z.boolean().default(true),
            prefix: z.string().default('/api/v1'),
            versioning: z.boolean().default(true),
            pagination: z
              .object({
                style: z.enum(['offset', 'cursor']).default('offset'),
                defaultLimit: z.number().default(20),
                maxLimit: z.number().default(100),
              })
              .optional(),
            sorting: z.boolean().default(true),
            filtering: z.boolean().default(true),
          }),
        ])
        .optional(),
      graphql: z
        .union([
          z.boolean(),
          z.object({
            enabled: z.boolean().default(true),
            path: z.string().default('/graphql'),
            playground: z.boolean().default(true),
            subscriptions: z.boolean().default(true),
          }),
        ])
        .optional(),
      trpc: z
        .union([
          z.boolean(),
          z.object({
            enabled: z.boolean().default(true),
            basePath: z.string().default('/trpc'),
          }),
        ])
        .optional(),
    })
    .optional(),

  /** Framework adapter */
  adapter: z
    .enum(['express', 'fastify', 'hono', 'koa', 'standalone'] as const)
    .optional(),

  /** Authentication configuration */
  auth: z
    .object({
      strategies: z.array(
        z.enum(['jwt', 'oauth', 'session', 'apikey', 'magic-link', 'passkey'] as const)
      ),
      jwt: z
        .object({
          accessTokenExpiry: z.string().default('15m'),
          refreshTokenExpiry: z.string().default('7d'),
          algorithm: z.string().default('RS256'),
        })
        .optional(),
      oauth: z
        .object({
          providers: z.array(z.string()),
          callbackUrl: z.string().optional(),
        })
        .optional(),
      session: z
        .object({
          store: z.enum(['memory', 'redis', 'database']).default('memory'),
          maxAge: z.number().default(86400),
        })
        .optional(),
      apikey: z
        .object({
          headerName: z.string().default('X-API-Key'),
          scopes: z.boolean().default(true),
        })
        .optional(),
    })
    .optional(),

  /** Database configuration */
  database: z
    .object({
      adapter: z.enum([
        'prisma',
        'drizzle',
        'kysely',
        'typeorm',
        'mongoose',
        'raw-sql',
      ] as const),
      migrations: z.boolean().default(true),
      seeding: z.boolean().default(false),
    })
    .optional(),

  /** Deployment targets */
  deploy: z
    .array(
      z.enum(['docker', 'vercel', 'railway', 'fly', 'lambda', 'kubernetes'] as const)
    )
    .optional(),

  /** Feature flags */
  features: z
    .object({
      swagger: z.boolean().default(true),
      cors: z.boolean().default(true),
      rateLimit: z
        .union([
          z.boolean(),
          z.object({
            enabled: z.boolean().default(true),
            max: z.number().default(100),
            windowMs: z.number().default(60000),
          }),
        ])
        .optional(),
      logging: z
        .union([
          z.boolean(),
          z.object({
            enabled: z.boolean().default(true),
            level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
            format: z.enum(['json', 'pretty']).default('json'),
          }),
        ])
        .optional(),
      validation: z.boolean().default(true),
      errorHandling: z.boolean().default(true),
      healthCheck: z.boolean().default(true),
      metrics: z.boolean().default(false),
      caching: z
        .union([
          z.boolean(),
          z.object({
            enabled: z.boolean().default(true),
            ttl: z.number().default(3600),
          }),
        ])
        .optional(),
    })
    .optional(),

  /** Code generation options */
  codegen: z
    .object({
      typescript: z
        .object({
          strict: z.boolean().default(true),
          target: z.string().default('ES2022'),
        })
        .optional(),
      prettier: z.boolean().default(true),
      eslint: z.boolean().default(true),
      tests: z
        .object({
          unit: z.boolean().default(true),
          integration: z.boolean().default(true),
          e2e: z.boolean().default(false),
        })
        .optional(),
    })
    .optional(),

  /** Hooks */
  hooks: z
    .object({
      beforeGenerate: z.function().optional(),
      afterGenerate: z.function().optional(),
      beforeWrite: z.function().optional(),
      afterWrite: z.function().optional(),
    })
    .optional(),
})

/**
 * OpenGenerator configuration type
 */
export type OpenGeneratorConfig = z.infer<typeof configSchema>

/**
 * Configuration loader result
 */
export interface ConfigResult {
  /** Configuration object */
  config: OpenGeneratorConfig
  /** Configuration file path */
  filepath: string | undefined
  /** Is the config empty/default */
  isEmpty: boolean
}

/**
 * Configuration explorer using cosmiconfig
 */
const explorer = cosmiconfig('opengenerator', {
  searchPlaces: [
    'package.json',
    'opengenerator.config.js',
    'opengenerator.config.cjs',
    'opengenerator.config.mjs',
    'opengenerator.config.ts',
    '.opengeneratorrc',
    '.opengeneratorrc.json',
    '.opengeneratorrc.yaml',
    '.opengeneratorrc.yml',
    '.opengeneratorrc.js',
    '.opengeneratorrc.cjs',
  ],
})

/**
 * Load configuration from file or default
 */
export async function loadConfig(
  configPath?: string,
  cwd?: string
): Promise<ConfigResult> {
  try {
    const result = configPath
      ? await explorer.load(configPath)
      : await explorer.search(cwd)

    if (!result || result.isEmpty) {
      return {
        config: configSchema.parse({ schema: './schema.prisma' }),
        filepath: undefined,
        isEmpty: true,
      }
    }

    const validated = configSchema.parse(result.config)

    return {
      config: validated,
      filepath: result.filepath,
      isEmpty: false,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
      throw new Error(`Invalid configuration:\n${messages.join('\n')}`)
    }
    throw error
  }
}

/**
 * Validate configuration
 */
export function validateConfig(config: unknown): OpenGeneratorConfig {
  return configSchema.parse(config)
}

/**
 * Create a type-safe configuration helper
 */
export function defineConfig(config: OpenGeneratorConfig): OpenGeneratorConfig {
  return configSchema.parse(config)
}

/**
 * Merge configurations
 */
export function mergeConfigs(
  base: Partial<OpenGeneratorConfig>,
  override: Partial<OpenGeneratorConfig>
): OpenGeneratorConfig {
  const merged: Record<string, unknown> = {
    ...base,
    ...override,
  }

  // Only merge nested objects if they exist
  if (base.api || override.api) {
    merged.api = { ...base.api, ...override.api }
  }

  if (base.auth || override.auth) {
    merged.auth = { ...base.auth, ...override.auth }
  }

  if (base.database || override.database) {
    merged.database = { ...base.database, ...override.database }
  }

  if (base.features || override.features) {
    merged.features = { ...base.features, ...override.features }
  }

  if (base.codegen || override.codegen) {
    merged.codegen = { ...base.codegen, ...override.codegen }
  }

  if (base.hooks || override.hooks) {
    merged.hooks = { ...base.hooks, ...override.hooks }
  }

  return configSchema.parse(merged)
}

/**
 * Get enabled API styles from config
 */
export function getEnabledApiStyles(config: OpenGeneratorConfig): ApiStyle[] {
  const styles: ApiStyle[] = []

  if (config.api?.rest === true || (typeof config.api?.rest === 'object' && config.api.rest.enabled)) {
    styles.push('rest')
  }

  if (config.api?.graphql === true || (typeof config.api?.graphql === 'object' && config.api.graphql.enabled)) {
    styles.push('graphql')
  }

  if (config.api?.trpc === true || (typeof config.api?.trpc === 'object' && config.api.trpc.enabled)) {
    styles.push('trpc')
  }

  return styles
}

/**
 * Get enabled auth strategies from config
 */
export function getEnabledAuthStrategies(config: OpenGeneratorConfig): AuthStrategy[] {
  return config.auth?.strategies ?? []
}

/**
 * Get deployment targets from config
 */
export function getDeployTargets(config: OpenGeneratorConfig): DeployTarget[] {
  return config.deploy ?? []
}
