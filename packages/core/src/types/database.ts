import type { Dependency, GeneratedCode, GeneratedFile, GeneratorOptions } from './generator'
import type { SchemaIR } from './schema'

/**
 * Database plugin interface
 * Database plugins generate database layer code (ORM, query builders, etc.)
 */
export interface DatabasePlugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Database adapter type */
  adapter: DatabaseAdapter
  /** Plugin priority (higher runs first) */
  priority?: number

  /**
   * Generate database layer code
   * @param schema - Parsed schema
   * @param options - Database options
   */
  generate(schema: SchemaIR, options: DatabaseOptions): Promise<GeneratedCode>

  /**
   * Generate database schema/migrations
   * @param schema - Current schema
   * @param previousSchema - Previous schema (for migrations)
   */
  generateMigrations?(schema: SchemaIR, previousSchema?: SchemaIR): Promise<Migration[]>

  /**
   * Generate seed data
   */
  generateSeeds?(schema: SchemaIR, options: DatabaseOptions): Promise<GeneratedFile[]>

  /**
   * Get required dependencies
   */
  getDependencies(): Dependency[]

  /**
   * Get peer dependencies
   */
  getPeerDependencies?(): Dependency[]
}

/**
 * Supported database adapters
 */
export type DatabaseAdapter = 'prisma' | 'drizzle' | 'kysely' | 'typeorm' | 'mongoose' | 'raw-sql'

/**
 * Database plugin options
 */
export interface DatabaseOptions extends GeneratorOptions {
  /** Database adapter */
  adapter?: DatabaseAdapter
  /** Database type */
  database?: DatabaseType
  /** Connection options */
  connection?: ConnectionOptions
  /** Enable migrations */
  migrations?: boolean
  /** Migration options */
  migrationOptions?: MigrationOptions
  /** Enable seeding */
  seeding?: boolean
  /** Seed options */
  seedOptions?: SeedOptions
  /** Logging options */
  logging?: DatabaseLoggingOptions
  /** Pool options */
  pool?: PoolOptions
  /** Naming conventions */
  naming?: NamingConventions
}

/**
 * Supported database types
 */
export type DatabaseType =
  | 'postgresql'
  | 'mysql'
  | 'mariadb'
  | 'sqlite'
  | 'sqlserver'
  | 'mongodb'
  | 'cockroachdb'

/**
 * Database connection options
 */
export interface ConnectionOptions {
  /** Connection string (env var name) */
  url?: string
  /** Host */
  host?: string
  /** Port */
  port?: number
  /** Database name */
  database?: string
  /** Username */
  username?: string
  /** Password (env var name) */
  password?: string
  /** SSL options */
  ssl?: SslOptions
  /** Schema (for PostgreSQL) */
  schema?: string
}

/**
 * SSL options
 */
export interface SslOptions {
  /** Enable SSL */
  enabled?: boolean
  /** Reject unauthorized */
  rejectUnauthorized?: boolean
  /** CA certificate path */
  caPath?: string
  /** Client certificate path */
  certPath?: string
  /** Client key path */
  keyPath?: string
}

/**
 * Connection pool options
 */
export interface PoolOptions {
  /** Minimum connections */
  min?: number
  /** Maximum connections */
  max?: number
  /** Acquire timeout in ms */
  acquireTimeout?: number
  /** Idle timeout in ms */
  idleTimeout?: number
  /** Connection timeout in ms */
  connectionTimeout?: number
}

/**
 * Migration options
 */
export interface MigrationOptions {
  /** Migrations directory */
  directory?: string
  /** Migration table name */
  tableName?: string
  /** Generate migrations automatically */
  autoGenerate?: boolean
  /** Run migrations on start */
  runOnStart?: boolean
  /** Migration file format */
  format?: 'sql' | 'typescript' | 'javascript'
}

/**
 * Seed options
 */
export interface SeedOptions {
  /** Seeds directory */
  directory?: string
  /** Run seeds on start */
  runOnStart?: boolean
  /** Seed environments */
  environments?: string[]
  /** Clear data before seeding */
  clearBeforeSeed?: boolean
}

/**
 * Database logging options
 */
export interface DatabaseLoggingOptions {
  /** Enable logging */
  enabled?: boolean
  /** Log queries */
  queries?: boolean
  /** Log slow queries */
  slowQueries?: boolean
  /** Slow query threshold in ms */
  slowQueryThreshold?: number
  /** Log errors */
  errors?: boolean
  /** Custom logger function */
  logger?: 'console' | 'file' | 'custom'
}

/**
 * Naming conventions
 */
export interface NamingConventions {
  /** Table name strategy */
  tableName?: 'camelCase' | 'snake_case' | 'PascalCase'
  /** Column name strategy */
  columnName?: 'camelCase' | 'snake_case' | 'PascalCase'
  /** Foreign key naming */
  foreignKey?: string // e.g., "{table}_{column}_fkey"
  /** Index naming */
  index?: string // e.g., "{table}_{columns}_idx"
  /** Unique constraint naming */
  unique?: string // e.g., "{table}_{columns}_unique"
}

/**
 * Migration definition
 */
export interface Migration {
  /** Migration name */
  name: string
  /** Migration timestamp */
  timestamp: number
  /** Up migration SQL/code */
  up: string
  /** Down migration SQL/code */
  down: string
  /** Migration format */
  format: 'sql' | 'typescript' | 'javascript'
}

/**
 * Repository interface for generated CRUD operations
 */
export interface RepositoryMethods {
  /** Find by ID */
  findById: boolean
  /** Find unique */
  findUnique: boolean
  /** Find first */
  findFirst: boolean
  /** Find many */
  findMany: boolean
  /** Create one */
  create: boolean
  /** Create many */
  createMany: boolean
  /** Update one */
  update: boolean
  /** Update many */
  updateMany: boolean
  /** Upsert */
  upsert: boolean
  /** Delete one */
  delete: boolean
  /** Delete many */
  deleteMany: boolean
  /** Count */
  count: boolean
  /** Aggregate */
  aggregate: boolean
  /** Group by */
  groupBy: boolean
  /** Transaction support */
  transaction: boolean
}

/**
 * Query options for find operations
 */
export interface QueryOptions {
  /** Where clause */
  where?: Record<string, unknown>
  /** Select fields */
  select?: Record<string, boolean>
  /** Include relations */
  include?: Record<string, boolean | object>
  /** Order by */
  orderBy?: Record<string, 'asc' | 'desc'>
  /** Skip records */
  skip?: number
  /** Take records */
  take?: number
  /** Cursor */
  cursor?: Record<string, unknown>
  /** Distinct */
  distinct?: string[]
}

/**
 * Database factory function type
 */
export type DatabaseFactory<T extends DatabaseOptions = DatabaseOptions> = (
  options?: Partial<T>
) => DatabasePlugin

/**
 * Create a base database plugin
 */
export function createDatabasePlugin(config: {
  name: string
  version: string
  adapter: DatabaseAdapter
  generate: DatabasePlugin['generate']
  getDependencies: DatabasePlugin['getDependencies']
  getPeerDependencies?: DatabasePlugin['getPeerDependencies']
  generateMigrations?: DatabasePlugin['generateMigrations']
  generateSeeds?: DatabasePlugin['generateSeeds']
  priority?: number
}): DatabasePlugin {
  return {
    name: config.name,
    version: config.version,
    adapter: config.adapter,
    priority: config.priority ?? 0,
    generate: config.generate,
    getDependencies: config.getDependencies,
    getPeerDependencies: config.getPeerDependencies,
    generateMigrations: config.generateMigrations,
    generateSeeds: config.generateSeeds,
  }
}
