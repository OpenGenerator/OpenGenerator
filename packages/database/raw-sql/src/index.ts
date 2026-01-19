/**
 * @opengenerator/db-raw-sql
 * Raw SQL database adapter for OpenGenerator (no ORM).
 */

import type { DatabasePlugin, DatabaseAdapter, DatabaseOptions, GeneratedCode, GeneratedFile, SchemaIR, Model, Field, Dependency } from '@opengenerator/core'

export interface RawSQLOptions { dialect?: 'postgresql' | 'mysql' | 'sqlite'; paramStyle?: '$' | '?' | ':'; softDelete?: boolean }
const DEFAULT_OPTIONS: RawSQLOptions = { dialect: 'postgresql', paramStyle: '$', softDelete: false }

function generateQueries(model: Model, options: RawSQLOptions): string {
  const table = model.name.toLowerCase()
  const p = options.paramStyle === '$' ? (i: number) => `$${i}` : options.paramStyle === ':' ? (i: number) => `:p${i}` : () => '?'
  const fields = model.fields.filter(f => !f.primaryKey && f.name !== 'createdAt' && f.name !== 'updatedAt')
  const fieldNames = fields.map(f => f.name)
  const insertParams = fields.map((_, i) => p(i + 1))

  return `export const ${model.name}Queries = {
  findAll: \`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT ${p(1)} OFFSET ${p(2)}\`,
  findById: \`SELECT * FROM ${table} WHERE id = ${p(1)}\`,
  count: \`SELECT COUNT(*) as count FROM ${table}\`,
  insert: \`INSERT INTO ${table} (${fieldNames.join(', ')}) VALUES (${insertParams.join(', ')}) RETURNING *\`,
  update: \`UPDATE ${table} SET ${fieldNames.map((n, i) => `${n} = ${p(i + 1)}`).join(', ')}, updated_at = NOW() WHERE id = ${p(fieldNames.length + 1)} RETURNING *\`,
  delete: ${options.softDelete ? `\`UPDATE ${table} SET deleted_at = NOW() WHERE id = ${p(1)}\`` : `\`DELETE FROM ${table} WHERE id = ${p(1)}\``},
}
`
}

function generateRepository(model: Model): string {
  return `import { ${model.name}Queries } from '../queries/${model.name.toLowerCase()}'

export interface DatabaseClient {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>
}

export interface ${model.name} {
${model.fields.map(f => `  ${f.name}: ${fieldToTs(f)}`).join('\n')}
}

export class ${model.name}Repository {
  constructor(private db: DatabaseClient) {}

  async findMany(params: { pagination?: { page: number; limit: number } } = {}) {
    const limit = params.pagination?.limit || 20
    const offset = params.pagination ? (params.pagination.page - 1) * limit : 0
    const { rows: data } = await this.db.query<${model.name}>(${model.name}Queries.findAll, [limit, offset])
    const { rows: [{ count }] } = await this.db.query<{ count: string }>(${model.name}Queries.count)
    return { data, total: parseInt(count, 10) }
  }

  async findById(id: string) {
    const { rows } = await this.db.query<${model.name}>(${model.name}Queries.findById, [id])
    return rows[0] || null
  }

  async create(data: Omit<${model.name}, 'id' | 'createdAt' | 'updatedAt'>) {
    const values = Object.values(data)
    const { rows } = await this.db.query<${model.name}>(${model.name}Queries.insert, values)
    return rows[0]
  }

  async update(id: string, data: Partial<Omit<${model.name}, 'id' | 'createdAt' | 'updatedAt'>>) {
    const values = [...Object.values(data), id]
    const { rows } = await this.db.query<${model.name}>(${model.name}Queries.update, values)
    return rows[0]
  }

  async delete(id: string) {
    await this.db.query(${model.name}Queries.delete, [id])
  }
}
`
}

function fieldToTs(field: Field): string {
  const map: Record<string, string> = {
    string: 'string', number: 'number', integer: 'number', float: 'number', boolean: 'boolean',
    datetime: 'Date', date: 'Date', time: 'string', json: 'Record<string, unknown>', bigint: 'bigint', decimal: 'string', uuid: 'string', bytes: 'Buffer',
  }
  const typeName = field.type.kind === 'scalar' ? field.type.type : 'string'
  let type = map[typeName] || 'unknown'
  if (!field.required) type += ' | null'
  return type
}

function generateIndex(schema: SchemaIR): string {
  const lines: string[] = []
  for (const model of schema.models) {
    lines.push(`export { ${model.name}Queries } from './queries/${model.name.toLowerCase()}'`)
    lines.push(`export { ${model.name}Repository, type ${model.name} } from './repositories/${model.name.toLowerCase()}'`)
  }
  return lines.join('\n')
}

export function createRawSQLDatabase(options: RawSQLOptions = {}): DatabasePlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/db-raw-sql',
    version: '1.0.0',
    adapter: 'raw-sql' as DatabaseAdapter,

    async generate(schema: SchemaIR, _options: DatabaseOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ..._options }
      const files: GeneratedFile[] = []

      for (const model of schema.models) {
        files.push({ path: `queries/${model.name.toLowerCase()}.ts`, content: generateQueries(model, opts), type: 'source' })
        files.push({ path: `repositories/${model.name.toLowerCase()}.ts`, content: generateRepository(model), type: 'source' })
      }
      files.push({ path: 'index.ts', content: generateIndex(schema), type: 'source' })

      return {
        files,
        dependencies: [],
        metadata: { database: '@opengenerator/db-raw-sql', version: '1.0.0', options: opts },
      }
    },

    getDependencies(): Dependency[] {
      return []
    },
  }
}

export const rawSqlDatabase = createRawSQLDatabase()
export default rawSqlDatabase
