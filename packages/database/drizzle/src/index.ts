/**
 * @opengenerator/db-drizzle
 * Drizzle ORM database adapter for OpenGenerator.
 */

import type { DatabasePlugin, DatabaseOptions, GeneratedCode, GeneratedFile, SchemaIR, Model, Field, Dependency } from '@opengenerator/core'

export interface DrizzleOptions extends DatabaseOptions {
  dialect?: 'postgresql' | 'mysql' | 'sqlite'
  softDelete?: boolean
  timestamps?: boolean
}

const DEFAULT_OPTIONS: Partial<DrizzleOptions> = { dialect: 'postgresql', softDelete: false, timestamps: true }

function fieldToDrizzle(field: Field, _dialect: string): string {
  const pg: Record<string, string> = {
    string: 'text', integer: 'integer', number: 'real', float: 'real', boolean: 'boolean',
    datetime: 'timestamp', date: 'timestamp', time: 'text', json: 'json', bigint: 'bigint', decimal: 'numeric', bytes: 'bytea', uuid: 'text'
  }
  const typeName = field.type.kind === 'scalar' ? field.type.type : 'text'
  const type = pg[typeName] || 'text'
  let def = `${type}('${field.name}')`
  if (field.primaryKey) def += '.primaryKey()'
  if (!field.required) def += '.notNull()'
  if (field.default) def += `.default(${JSON.stringify(field.default)})`
  return def
}

function generateSchema(schema: SchemaIR, options: DrizzleOptions): string {
  const lines = ['import { pgTable, text, integer, boolean, timestamp, json, real, bigint, numeric, bytea } from "drizzle-orm/pg-core"', '']

  for (const model of schema.models) {
    lines.push(`export const ${model.name.toLowerCase()}Table = pgTable('${model.name.toLowerCase()}', {`)
    for (const field of model.fields) {
      lines.push(`  ${field.name}: ${fieldToDrizzle(field, options.dialect || 'postgresql')},`)
    }
    if (options.softDelete) lines.push("  deletedAt: timestamp('deleted_at'),")
    lines.push('})')
    lines.push('')
  }
  return lines.join('\n')
}

function generateRepository(model: Model, _options: DrizzleOptions): string {
  const name = model.name
  const table = `${name.toLowerCase()}Table`

  return `import { eq, and, sql } from 'drizzle-orm'
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { ${table} } from '../schema'

export type ${name} = typeof ${table}.$inferSelect
export type ${name}CreateInput = typeof ${table}.$inferInsert

export class ${name}Repository {
  constructor(private db: PostgresJsDatabase) {}

  async findMany(params: { filter?: Partial<${name}>; pagination?: { page: number; limit: number } } = {}) {
    const { pagination } = params
    const offset = pagination ? (pagination.page - 1) * pagination.limit : 0
    const limit = pagination?.limit || 20

    const data = await this.db.select().from(${table}).limit(limit).offset(offset)
    const [{ count }] = await this.db.select({ count: sql<number>\`count(*)\` }).from(${table})
    return { data, total: Number(count) }
  }

  async findById(id: string) {
    const [result] = await this.db.select().from(${table}).where(eq(${table}.id, id))
    return result || null
  }

  async create(data: ${name}CreateInput) {
    const [result] = await this.db.insert(${table}).values(data).returning()
    return result
  }

  async update(id: string, data: Partial<${name}CreateInput>) {
    const [result] = await this.db.update(${table}).set(data).where(eq(${table}.id, id)).returning()
    return result
  }

  async delete(id: string) {
    await this.db.delete(${table}).where(eq(${table}.id, id))
  }
}
`
}

function generateIndex(schema: SchemaIR): string {
  const lines = ["export * from './schema'"]
  for (const model of schema.models) {
    lines.push(`export { ${model.name}Repository } from './repositories/${model.name.toLowerCase()}'`)
  }
  return lines.join('\n')
}

export function createDrizzleDatabase(options: Partial<DrizzleOptions> = {}): DatabasePlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const deps: Dependency[] = [
    { name: 'drizzle-orm', version: '^0.29.0', dev: false },
    { name: 'drizzle-kit', version: '^0.20.0', dev: true },
    { name: 'postgres', version: '^3.4.0', dev: false },
  ]

  return {
    name: '@opengenerator/db-drizzle',
    version: '1.0.0',
    adapter: 'drizzle',

    async generate(schema: SchemaIR, genOptions: DatabaseOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ...genOptions } as DrizzleOptions
      const files: GeneratedFile[] = []

      files.push({ path: 'schema.ts', content: generateSchema(schema, opts), type: 'source' })
      for (const model of schema.models) {
        files.push({ path: `repositories/${model.name.toLowerCase()}.ts`, content: generateRepository(model, opts), type: 'source' })
      }
      files.push({ path: 'index.ts', content: generateIndex(schema), type: 'source' })

      return {
        files,
        dependencies: deps,
        metadata: { database: '@opengenerator/db-drizzle', version: '1.0.0', options: opts },
      }
    },

    getDependencies(): Dependency[] {
      return deps
    },
  }
}

export const drizzleDatabase = createDrizzleDatabase()
export default drizzleDatabase
