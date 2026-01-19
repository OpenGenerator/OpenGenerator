/**
 * @opengenerator/db-mongoose
 * Mongoose (MongoDB) database adapter for OpenGenerator.
 */

import type { DatabasePlugin, DatabaseAdapter, DatabaseOptions, GeneratedCode, GeneratedFile, SchemaIR, Model, Field, Dependency } from '@opengenerator/core'

export interface MongooseOptions { softDelete?: boolean; timestamps?: boolean }
const DEFAULT_OPTIONS: MongooseOptions = { softDelete: false, timestamps: true }

function fieldToMongoose(field: Field): string {
  const map: Record<string, string> = {
    string: 'String', integer: 'Number', number: 'Number', float: 'Number', boolean: 'Boolean',
    datetime: 'Date', date: 'Date', json: 'Schema.Types.Mixed', bigint: 'BigInt', decimal: 'Schema.Types.Decimal128',
  }
  const typeName = field.type.kind === 'scalar' ? field.type.type : 'string'
  let type = map[typeName] || 'String'
  if (field.type.kind === 'array') type = `[${type}]`
  return `{ type: ${type}${field.required ? ', required: true' : ''}${field.unique ? ', unique: true' : ''} }`
}

function generateModel(model: Model, options: MongooseOptions): string {
  return `import mongoose, { Schema, Document, Model } from 'mongoose'

export interface I${model.name} extends Document {
${model.fields.map(f => `  ${f.name}${!f.required ? '?' : ''}: ${fieldToTs(f)}`).join('\n')}
}

const ${model.name}Schema = new Schema({
${model.fields.filter(f => f.name !== 'id').map(f => `  ${f.name}: ${fieldToMongoose(f)},`).join('\n')}
}${options.timestamps ? ', { timestamps: true }' : ''})

export const ${model.name}Model: Model<I${model.name}> = mongoose.models.${model.name} || mongoose.model<I${model.name}>('${model.name}', ${model.name}Schema)
`
}

function fieldToTs(field: Field): string {
  const map: Record<string, string> = {
    string: 'string', integer: 'number', number: 'number', float: 'number', boolean: 'boolean',
    datetime: 'Date', date: 'Date', json: 'Record<string, unknown>', bigint: 'bigint', decimal: 'string',
  }
  const typeName = field.type.kind === 'scalar' ? field.type.type : 'string'
  let type = map[typeName] || 'unknown'
  if (field.type.kind === 'array') type = `${type}[]`
  if (!field.required) type += ' | null'
  return type
}

function generateRepository(model: Model): string {
  return `import { ${model.name}Model, I${model.name} } from '../models/${model.name.toLowerCase()}'
import { FilterQuery } from 'mongoose'

export class ${model.name}Repository {
  async findMany(params: { filter?: FilterQuery<I${model.name}>; pagination?: { page: number; limit: number } } = {}) {
    const { filter = {}, pagination } = params
    const skip = pagination ? (pagination.page - 1) * pagination.limit : 0
    const limit = pagination?.limit || 20
    const [data, total] = await Promise.all([
      ${model.name}Model.find(filter).skip(skip).limit(limit).exec(),
      ${model.name}Model.countDocuments(filter).exec(),
    ])
    return { data, total }
  }

  async findById(id: string) { return ${model.name}Model.findById(id).exec() }
  async create(data: Partial<I${model.name}>) { return ${model.name}Model.create(data) }
  async update(id: string, data: Partial<I${model.name}>) { return ${model.name}Model.findByIdAndUpdate(id, data, { new: true }).exec() }
  async delete(id: string) { await ${model.name}Model.findByIdAndDelete(id).exec() }
}
`
}

function generateIndex(schema: SchemaIR): string {
  const lines: string[] = []
  for (const model of schema.models) {
    lines.push(`export { ${model.name}Model, type I${model.name} } from './models/${model.name.toLowerCase()}'`)
    lines.push(`export { ${model.name}Repository } from './repositories/${model.name.toLowerCase()}'`)
  }
  return lines.join('\n')
}

export function createMongooseDatabase(options: MongooseOptions = {}): DatabasePlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/db-mongoose',
    version: '1.0.0',
    adapter: 'mongoose' as DatabaseAdapter,

    async generate(schema: SchemaIR, _options: DatabaseOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ..._options }
      const files: GeneratedFile[] = []

      for (const model of schema.models) {
        files.push({ path: `models/${model.name.toLowerCase()}.ts`, content: generateModel(model, opts), type: 'source' })
        files.push({ path: `repositories/${model.name.toLowerCase()}.ts`, content: generateRepository(model), type: 'source' })
      }
      files.push({ path: 'index.ts', content: generateIndex(schema), type: 'source' })

      return {
        files,
        dependencies: [{ name: 'mongoose', version: '^8.0.0', dev: false }],
        metadata: { database: '@opengenerator/db-mongoose', version: '1.0.0', options: opts },
      }
    },

    getDependencies(): Dependency[] {
      return [{ name: 'mongoose', version: '^8.0.0', dev: false }]
    },
  }
}

export const mongooseDatabase = createMongooseDatabase()
export default mongooseDatabase
