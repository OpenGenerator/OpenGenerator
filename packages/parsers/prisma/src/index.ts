/**
 * @opengenerator/parser-prisma
 *
 * Prisma schema parser for OpenGenerator
 */

import { getSchema } from '@mrleebo/prisma-ast'

import {
  createParserPlugin,
  createEmptySchema,
  createDefaultCrudConfig,
  type ParserPlugin,
  type ParserOptions,
  type SchemaIR,
  type Model,
  type Field,
  type FieldType,
  type FieldDefault,
  type ValidationRules,
  type FieldRelation,
  type Enum,
  type Relation,
  type Index,
} from '@opengenerator/core'

export { prismaParser, createPrismaParser }
export type { PrismaParserOptions }

/**
 * Prisma parser options
 */
interface PrismaParserOptions extends ParserOptions {
  /** Include models starting with underscore */
  includeUnderscoreModels?: boolean
  /** Default CRUD operations */
  defaultCrud?: Partial<Model['crud']>
}

/**
 * Create a Prisma parser plugin
 */
function createPrismaParser(options: PrismaParserOptions = {}): ParserPlugin {
  return createParserPlugin({
    name: 'prisma',
    version: '1.0.0',
    extensions: ['.prisma'],

    canParse(input: string | Buffer, filePath?: string): boolean {
      const content = typeof input === 'string' ? input : input.toString('utf-8')

      // Check file extension
      if (filePath?.endsWith('.prisma')) {
        return true
      }

      // Check content for Prisma schema patterns
      return (
        content.includes('model ') ||
        content.includes('datasource ') ||
        content.includes('generator ')
      )
    },

    async parse(input: string | Buffer, parseOptions?: ParserOptions): Promise<SchemaIR> {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const mergedOptions = { ...options, ...parseOptions }

      try {
        const ast = getSchema(content)
        return convertToSchemaIR(ast, mergedOptions)
      } catch (error) {
        throw new Error(`Failed to parse Prisma schema: ${(error as Error).message}`)
      }
    },

    validate(input: string | Buffer) {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const errors: Array<{ message: string; severity: 'error' }> = []
      const warnings: Array<{ message: string; severity: 'warning' }> = []

      try {
        getSchema(content)
      } catch (error) {
        errors.push({
          message: (error as Error).message,
          severity: 'error',
        })
      }

      // Check for common issues
      if (!content.includes('datasource ')) {
        warnings.push({
          message: 'No datasource block found',
          severity: 'warning',
        })
      }

      if (!content.includes('model ')) {
        warnings.push({
          message: 'No models found in schema',
          severity: 'warning',
        })
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      }
    },
  })
}

/**
 * Default Prisma parser instance
 */
const prismaParser = createPrismaParser

/**
 * Convert Prisma AST to SchemaIR
 */
function convertToSchemaIR(ast: ReturnType<typeof getSchema>, options: PrismaParserOptions): SchemaIR {
  const schema = createEmptySchema('prisma-schema', 'prisma')

  // Process enums
  for (const item of ast.list) {
    if (item.type === 'enum') {
      schema.enums.push(convertEnum(item))
    }
  }

  // Process models
  for (const item of ast.list) {
    if (item.type === 'model') {
      // Skip underscore models if not included
      if (!options.includeUnderscoreModels && item.name.startsWith('_')) {
        continue
      }

      const model = convertModel(item, schema.enums, options)
      schema.models.push(model)
    }
  }

  // Extract relations
  schema.relations = extractRelations(schema.models)

  return schema
}

/**
 * Convert Prisma enum to SchemaIR Enum
 */
function convertEnum(prismaEnum: { name: string; enumerators: Array<unknown> }): Enum {
  const enumerators = prismaEnum.enumerators.filter(
    (e): e is { type: string; name: string } =>
      typeof e === 'object' && e !== null && 'name' in e && typeof (e as { name?: unknown }).name === 'string'
  )
  return {
    name: prismaEnum.name,
    values: enumerators.map((e) => ({
      name: e.name,
    })),
  }
}

/**
 * Convert Prisma model to SchemaIR Model
 */
function convertModel(
  prismaModel: {
    name: string
    properties: Array<unknown>
  },
  enums: Enum[],
  options: PrismaParserOptions
): Model {
  const fields: Field[] = []
  const indexes: Index[] = []
  const enumNames = new Set(enums.map((e) => e.name))

  for (const prop of prismaModel.properties) {
    const p = prop as { type?: string; name?: string; fieldType?: string | object; array?: boolean; optional?: boolean; attributes?: Array<{ name: string; args?: Array<{ value: unknown }> }> }
    if (p.type === 'field' && p.name && p.fieldType && typeof p.fieldType === 'string') {
      const field = convertField(p as { name: string; fieldType: string; array?: boolean; optional?: boolean; attributes?: Array<{ name: string; args?: Array<{ value: unknown }> }> }, enumNames)
      if (field) {
        fields.push(field)
      }
    }

    if (p.type === 'attribute' && p.name) {
      // Handle @@index, @@unique, etc.
      if (p.name === 'index' || p.name === 'unique') {
        const index = extractIndex(p as { args?: Array<{ value: unknown }> }, p.name === 'unique')
        if (index) {
          indexes.push(index)
        }
      }
    }
  }

  // Check for timestamps
  const hasTimestamps =
    fields.some((f) => f.name === 'createdAt') && fields.some((f) => f.name === 'updatedAt')

  // Check for soft delete
  const hasSoftDelete = fields.some((f) => f.name === 'deletedAt')

  return {
    name: prismaModel.name,
    fields,
    indexes: indexes.length > 0 ? indexes : undefined,
    crud: {
      ...createDefaultCrudConfig(),
      ...options.defaultCrud,
    },
    timestamps: hasTimestamps,
    softDelete: hasSoftDelete,
  }
}

/**
 * Convert Prisma field to SchemaIR Field
 */
function convertField(
  prismaField: {
    name?: string
    fieldType?: string
    array?: boolean
    optional?: boolean
    attributes?: Array<{
      name: string
      args?: Array<{ value: unknown }>
    }>
  },
  enumNames: Set<string>
): Field | null {
  if (!prismaField.name || !prismaField.fieldType) {
    return null
  }

  const fieldType = convertFieldType(prismaField.fieldType, prismaField.array ?? false, enumNames)
  const attributes = prismaField.attributes ?? []

  // Check for @id
  const isPrimaryKey = attributes.some((a) => a.name === 'id')

  // Check for @unique
  const isUnique = attributes.some((a) => a.name === 'unique')

  // Check for @default
  const defaultAttr = attributes.find((a) => a.name === 'default')
  const defaultValue = defaultAttr ? extractDefault(defaultAttr, fieldType) : undefined

  // Check for @relation
  const relationAttr = attributes.find((a) => a.name === 'relation')
  const relation = relationAttr ? extractRelation(relationAttr, prismaField.fieldType) : undefined

  // Check for validation attributes
  const validation = extractValidation(attributes)

  // Check for @map (column name)
  const mapAttr = attributes.find((a) => a.name === 'map')
  const columnName = mapAttr?.args?.[0]?.value as string | undefined

  return {
    name: prismaField.name,
    type: fieldType,
    required: !prismaField.optional && !isPrimaryKey,
    primaryKey: isPrimaryKey,
    unique: isUnique,
    default: defaultValue,
    relation,
    validation: Object.keys(validation).length > 0 ? validation : undefined,
    columnName,
  }
}

/**
 * Convert Prisma field type to SchemaIR FieldType
 */
function convertFieldType(
  prismaType: string,
  isArray: boolean,
  enumNames: Set<string>
): FieldType {
  // Check if it's an enum
  if (enumNames.has(prismaType)) {
    const enumType: FieldType = { kind: 'enum', name: prismaType }
    return isArray ? { kind: 'array', of: enumType } : enumType
  }

  // Map Prisma types to scalar types
  const typeMap: Record<string, FieldType> = {
    String: { kind: 'scalar', type: 'string' },
    Int: { kind: 'scalar', type: 'integer' },
    BigInt: { kind: 'scalar', type: 'bigint' },
    Float: { kind: 'scalar', type: 'float' },
    Decimal: { kind: 'scalar', type: 'decimal' },
    Boolean: { kind: 'scalar', type: 'boolean' },
    DateTime: { kind: 'scalar', type: 'datetime' },
    Json: { kind: 'scalar', type: 'json' },
    Bytes: { kind: 'scalar', type: 'bytes' },
  }

  const scalarType = typeMap[prismaType]

  if (scalarType) {
    return isArray ? { kind: 'array', of: scalarType } : scalarType
  }

  // Assume it's a relation to another model
  const refType: FieldType = { kind: 'reference', model: prismaType }
  return isArray ? { kind: 'array', of: refType } : refType
}

/**
 * Extract default value from @default attribute
 */
function extractDefault(
  attr: { args?: Array<{ value: unknown }> },
  _fieldType: FieldType
): FieldDefault | undefined {
  const arg = attr.args?.[0]
  if (!arg) return undefined

  const value = arg.value

  // Check for functions like autoincrement(), now(), uuid(), cuid()
  if (typeof value === 'object' && value !== null && 'type' in value) {
    const funcValue = value as { type: string; name?: string }
    if (funcValue.type === 'function' && funcValue.name) {
      const funcName = funcValue.name.toLowerCase()
      if (['now', 'uuid', 'cuid', 'autoincrement', 'dbgenerated'].includes(funcName)) {
        return {
          kind: 'function',
          name: funcName as 'now' | 'uuid' | 'cuid' | 'autoincrement' | 'dbgenerated',
        }
      }
    }
  }

  // Literal value
  return { kind: 'literal', value }
}

/**
 * Extract relation info from @relation attribute
 */
function extractRelation(
  attr: { args?: Array<{ value: unknown }> },
  targetModel: string
): FieldRelation | undefined {
  const args = attr.args ?? []

  // Find fields and references
  let fields: string[] = []
  let references: string[] = []
  let relationName: string | undefined

  for (const arg of args) {
    const value = arg.value as { key?: string; value?: unknown } | string

    if (typeof value === 'string') {
      relationName = value
    } else if (typeof value === 'object' && value !== null) {
      if (value.key === 'fields' && Array.isArray(value.value)) {
        fields = value.value as string[]
      }
      if (value.key === 'references' && Array.isArray(value.value)) {
        references = value.value as string[]
      }
      // Note: onDelete and onUpdate are parsed by Prisma but not currently used in SchemaIR
    }
  }

  return {
    type: 'many-to-one', // Default, will be refined later
    model: targetModel,
    field: references[0] ?? 'id',
    foreignKey: fields[0],
    name: relationName,
  }
}

/**
 * Extract validation rules from attributes
 */
function extractValidation(
  attributes: Array<{ name: string; args?: Array<{ value: unknown }> }>
): ValidationRules {
  const rules: ValidationRules = {}

  for (const attr of attributes) {
    switch (attr.name) {
      case 'db.VarChar':
      case 'db.Char': {
        const length = attr.args?.[0]?.value as number | undefined
        if (length) {
          rules.maxLength = length
        }
        break
      }
      case 'db.Text':
        // No specific validation
        break
    }
  }

  return rules
}

/**
 * Extract index from @@index or @@unique
 */
function extractIndex(
  attr: { args?: Array<{ value: unknown }> },
  isUnique: boolean
): Index | undefined {
  const args = attr.args ?? []
  const fields: string[] = []

  for (const arg of args) {
    const value = arg.value
    if (Array.isArray(value)) {
      fields.push(...(value as string[]))
    } else if (typeof value === 'string') {
      fields.push(value)
    }
  }

  if (fields.length === 0) return undefined

  return {
    fields: fields.map((name) => ({ name })),
    unique: isUnique,
  }
}

/**
 * Extract relations from models
 */
function extractRelations(models: Model[]): Relation[] {
  const relations: Relation[] = []
  const modelNames = new Set(models.map((m) => m.name))

  for (const model of models) {
    for (const field of model.fields) {
      if (field.relation && modelNames.has(field.relation.model)) {
        relations.push({
          name: field.relation.name ?? `${model.name}_${field.name}`,
          type: field.relation.type,
          from: {
            model: model.name,
            field: field.name,
          },
          to: {
            model: field.relation.model,
            field: field.relation.field,
          },
        })
      }
    }
  }

  return relations
}

// Default export
export default prismaParser
