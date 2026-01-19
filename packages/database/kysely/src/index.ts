/**
 * @opengenerator/db-kysely
 * Kysely database adapter for OpenGenerator.
 */

import type { DatabasePlugin, DatabaseAdapter, DatabaseOptions, GeneratedCode, GeneratedFile, SchemaIR, Model, Field, Dependency } from '@opengenerator/core'

export interface KyselyOptions {
  dialect?: 'postgresql' | 'mysql' | 'sqlite'
  softDelete?: boolean
  timestamps?: boolean
}

const DEFAULT_OPTIONS: KyselyOptions = { dialect: 'postgresql', softDelete: false, timestamps: true }

function generateTypes(schema: SchemaIR): string {
  const lines = ['import { Generated, Insertable, Selectable, Updateable } from "kysely"', '']

  for (const model of schema.models) {
    lines.push(`export interface ${model.name}Table {`)
    for (const field of model.fields) {
      const tsType = fieldToTs(field)
      if (field.primaryKey) {
        lines.push(`  ${field.name}: Generated<${tsType}>`)
      } else {
        lines.push(`  ${field.name}: ${tsType}${!field.required ? ' | null' : ''}`)
      }
    }
    lines.push('}')
    lines.push(`export type ${model.name} = Selectable<${model.name}Table>`)
    lines.push(`export type New${model.name} = Insertable<${model.name}Table>`)
    lines.push(`export type ${model.name}Update = Updateable<${model.name}Table>`)
    lines.push('')
  }

  lines.push('export interface Database {')
  for (const model of schema.models) {
    lines.push(`  ${model.name.toLowerCase()}: ${model.name}Table`)
  }
  lines.push('}')

  return lines.join('\n')
}

function fieldToTs(field: Field): string {
  const map: Record<string, string> = {
    string: 'string', integer: 'number', number: 'number', float: 'number', boolean: 'boolean',
    datetime: 'Date', date: 'Date', time: 'string', json: 'Record<string, unknown>', bigint: 'bigint', decimal: 'string', bytes: 'Buffer', uuid: 'string'
  }
  const typeName = field.type.kind === 'scalar' ? field.type.type : 'string'
  return map[typeName] || 'unknown'
}

function generateRepository(model: Model): string {
  const name = model.name
  const table = name.toLowerCase()

  return `import { Kysely, sql } from 'kysely'
import { Database, ${name}, New${name}, ${name}Update } from '../types'

export class ${name}Repository {
  constructor(private db: Kysely<Database>) {}

  async findMany(params: { pagination?: { page: number; limit: number } } = {}) {
    const { pagination } = params
    let query = this.db.selectFrom('${table}').selectAll()
    if (pagination) {
      query = query.offset((pagination.page - 1) * pagination.limit).limit(pagination.limit)
    }
    const data = await query.execute()
    const { count } = await this.db.selectFrom('${table}').select(sql<number>\`count(*)\`.as('count')).executeTakeFirstOrThrow()
    return { data, total: Number(count) }
  }

  async findById(id: string) {
    return this.db.selectFrom('${table}').selectAll().where('id', '=', id).executeTakeFirst()
  }

  async create(data: New${name}) {
    return this.db.insertInto('${table}').values(data).returningAll().executeTakeFirstOrThrow()
  }

  async update(id: string, data: ${name}Update) {
    return this.db.updateTable('${table}').set(data).where('id', '=', id).returningAll().executeTakeFirstOrThrow()
  }

  async delete(id: string) {
    await this.db.deleteFrom('${table}').where('id', '=', id).execute()
  }
}
`
}

function generateIndex(schema: SchemaIR): string {
  const lines = ["export * from './types'"]
  for (const model of schema.models) {
    lines.push(`export { ${model.name}Repository } from './repositories/${model.name.toLowerCase()}'`)
  }
  return lines.join('\n')
}

export function createKyselyDatabase(options: KyselyOptions = {}): DatabasePlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/db-kysely',
    version: '1.0.0',
    adapter: 'kysely' as DatabaseAdapter,

    async generate(schema: SchemaIR, _options: DatabaseOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ..._options }
      const files: GeneratedFile[] = []

      files.push({ path: 'types.ts', content: generateTypes(schema), type: 'source' })
      for (const model of schema.models) {
        files.push({ path: `repositories/${model.name.toLowerCase()}.ts`, content: generateRepository(model), type: 'source' })
      }
      files.push({ path: 'index.ts', content: generateIndex(schema), type: 'source' })

      return {
        files,
        dependencies: [{ name: 'kysely', version: '^0.27.0', dev: false }, { name: 'pg', version: '^8.11.0', dev: false }],
        metadata: { database: '@opengenerator/db-kysely', version: '1.0.0', options: opts },
      }
    },

    getDependencies(): Dependency[] {
      return [{ name: 'kysely', version: '^0.27.0', dev: false }, { name: 'pg', version: '^8.11.0', dev: false }]
    },
  }
}

export const kyselyDatabase = createKyselyDatabase()
export default kyselyDatabase
