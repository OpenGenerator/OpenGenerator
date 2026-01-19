/**
 * @opengenerator/db-typeorm
 * TypeORM database adapter for OpenGenerator.
 */

import type { DatabasePlugin, DatabaseAdapter, DatabaseOptions, GeneratedCode, GeneratedFile, SchemaIR, Model, Field, Dependency } from '@opengenerator/core'

export interface TypeORMOptions { dialect?: 'postgres' | 'mysql' | 'sqlite' | 'mssql'; softDelete?: boolean; timestamps?: boolean }
const DEFAULT_OPTIONS: TypeORMOptions = { dialect: 'postgres', softDelete: false, timestamps: true }

function fieldToTypeORM(field: Field): { decorator: string; type: string } {
  const map: Record<string, { d: string; t: string }> = {
    string: { d: '@Column()', t: 'string' },
    integer: { d: '@Column("int")', t: 'number' },
    number: { d: '@Column("float")', t: 'number' },
    float: { d: '@Column("float")', t: 'number' },
    boolean: { d: '@Column("boolean")', t: 'boolean' },
    datetime: { d: '@Column("timestamp")', t: 'Date' },
    date: { d: '@Column("date")', t: 'Date' },
    time: { d: '@Column("time")', t: 'string' },
    json: { d: '@Column("json")', t: 'Record<string, unknown>' },
    bigint: { d: '@Column("bigint")', t: 'bigint' },
    decimal: { d: '@Column("decimal")', t: 'string' },
    uuid: { d: '@Column("uuid")', t: 'string' },
    bytes: { d: '@Column("bytea")', t: 'Buffer' },
  }
  const typeName = field.type.kind === 'scalar' ? field.type.type : 'string'
  const m = map[typeName] || { d: '@Column()', t: 'string' }
  return { decorator: m.d, type: m.t }
}

function generateEntity(model: Model, options: TypeORMOptions): string {
  const lines = [
    'import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from "typeorm"',
    '',
    `@Entity('${model.name.toLowerCase()}')`,
    `export class ${model.name}Entity {`,
  ]

  for (const field of model.fields) {
    if (field.primaryKey) {
      lines.push('  @PrimaryGeneratedColumn("uuid")')
      lines.push(`  ${field.name}: string`)
    } else if (field.name === 'createdAt') {
      lines.push('  @CreateDateColumn()')
      lines.push('  createdAt: Date')
    } else if (field.name === 'updatedAt') {
      lines.push('  @UpdateDateColumn()')
      lines.push('  updatedAt: Date')
    } else {
      const { decorator, type } = fieldToTypeORM(field)
      lines.push(`  ${decorator}`)
      lines.push(`  ${field.name}${!field.required ? '?' : ''}: ${type}${!field.required ? ' | null' : ''}`)
    }
    lines.push('')
  }

  if (options.softDelete) {
    lines.push('  @DeleteDateColumn()')
    lines.push('  deletedAt?: Date')
    lines.push('')
  }

  lines.push('}')
  return lines.join('\n')
}

function generateRepository(model: Model): string {
  return `import { Repository, DataSource } from 'typeorm'
import { ${model.name}Entity } from '../entities/${model.name.toLowerCase()}'

export class ${model.name}Repository {
  private repo: Repository<${model.name}Entity>

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(${model.name}Entity)
  }

  async findMany(params: { pagination?: { page: number; limit: number } } = {}) {
    const { pagination } = params
    const [data, total] = await this.repo.findAndCount({
      skip: pagination ? (pagination.page - 1) * pagination.limit : 0,
      take: pagination?.limit || 20,
    })
    return { data, total }
  }

  async findById(id: string) { return this.repo.findOneBy({ id } as any) }
  async create(data: Partial<${model.name}Entity>) { return this.repo.save(this.repo.create(data)) }
  async update(id: string, data: Partial<${model.name}Entity>) { await this.repo.update(id, data); return this.findById(id) }
  async delete(id: string) { await this.repo.delete(id) }
}
`
}

function generateIndex(schema: SchemaIR): string {
  const lines: string[] = []
  for (const model of schema.models) {
    lines.push(`export { ${model.name}Entity } from './entities/${model.name.toLowerCase()}'`)
    lines.push(`export { ${model.name}Repository } from './repositories/${model.name.toLowerCase()}'`)
  }
  return lines.join('\n')
}

export function createTypeORMDatabase(options: TypeORMOptions = {}): DatabasePlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/db-typeorm',
    version: '1.0.0',
    adapter: 'typeorm' as DatabaseAdapter,

    async generate(schema: SchemaIR, _options: DatabaseOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ..._options }
      const files: GeneratedFile[] = []

      for (const model of schema.models) {
        files.push({ path: `entities/${model.name.toLowerCase()}.ts`, content: generateEntity(model, opts), type: 'source' })
        files.push({ path: `repositories/${model.name.toLowerCase()}.ts`, content: generateRepository(model), type: 'source' })
      }
      files.push({ path: 'index.ts', content: generateIndex(schema), type: 'source' })

      return {
        files,
        dependencies: [{ name: 'typeorm', version: '^0.3.0', dev: false }, { name: 'pg', version: '^8.11.0', dev: false }],
        metadata: { database: '@opengenerator/db-typeorm', version: '1.0.0', options: opts },
      }
    },

    getDependencies(): Dependency[] {
      return [{ name: 'typeorm', version: '^0.3.0', dev: false }, { name: 'pg', version: '^8.11.0', dev: false }]
    },
  }
}

export const typeormDatabase = createTypeORMDatabase()
export default typeormDatabase
