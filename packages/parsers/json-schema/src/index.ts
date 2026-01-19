/**
 * @opengenerator/parser-json-schema
 *
 * JSON Schema parser for OpenGenerator
 */

import Ajv from 'ajv'
import type { JSONSchema7 } from 'json-schema'

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
  type Enum,
  type ValidationRules,
} from '@opengenerator/core'

export { jsonSchemaParser, createJsonSchemaParser }
export type { JsonSchemaParserOptions }

/**
 * JSON Schema parser options
 */
interface JsonSchemaParserOptions extends ParserOptions {
  /** JSON Schema draft version */
  draft?: '07' | '2019-09' | '2020-12'
  /** Extract definitions as models */
  extractDefinitions?: boolean
}

/**
 * Create a JSON Schema parser plugin
 */
function createJsonSchemaParser(options: JsonSchemaParserOptions = {}): ParserPlugin {
  const ajv = new Ajv({ allErrors: true, strict: false })

  return createParserPlugin({
    name: 'json-schema',
    version: '1.0.0',
    extensions: ['.json', '.schema.json'],

    canParse(input: string | Buffer, _filePath?: string): boolean {
      const content = typeof input === 'string' ? input : input.toString('utf-8')

      try {
        const parsed = JSON.parse(content)
        // Check for JSON Schema indicators
        return (
          parsed.$schema?.includes('json-schema.org') ||
          parsed.type === 'object' ||
          parsed.definitions ||
          parsed.$defs ||
          parsed.properties
        )
      } catch {
        return false
      }
    },

    async parse(input: string | Buffer, parseOptions?: ParserOptions): Promise<SchemaIR> {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const mergedOptions = { ...options, ...parseOptions }

      try {
        const jsonSchema = JSON.parse(content) as JSONSchema7
        return convertToSchemaIR(jsonSchema, mergedOptions)
      } catch (error) {
        throw new Error(`Failed to parse JSON Schema: ${(error as Error).message}`)
      }
    },

    validate(input: string | Buffer) {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const errors: Array<{ message: string; severity: 'error' }> = []
      const warnings: Array<{ message: string; severity: 'warning' }> = []

      try {
        const parsed = JSON.parse(content) as JSONSchema7
        const valid = ajv.validateSchema(parsed)

        if (!valid && ajv.errors) {
          for (const error of ajv.errors) {
            errors.push({
              message: `${error.instancePath}: ${error.message}`,
              severity: 'error',
            })
          }
        }

        if (!parsed.title) {
          warnings.push({
            message: 'Missing title field',
            severity: 'warning',
          })
        }
      } catch (error) {
        errors.push({
          message: (error as Error).message,
          severity: 'error',
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
 * Default JSON Schema parser instance
 */
const jsonSchemaParser = createJsonSchemaParser

/**
 * Convert JSON Schema to SchemaIR
 */
function convertToSchemaIR(jsonSchema: JSONSchema7, _options: JsonSchemaParserOptions): SchemaIR {
  const schema = createEmptySchema(jsonSchema.title ?? 'json-schema', 'json-schema')
  schema.metadata.description = jsonSchema.description

  // Extract definitions
  const definitions = jsonSchema.definitions ?? jsonSchema.$defs ?? {}

  for (const [name, def] of Object.entries(definitions)) {
    const defSchema = def as JSONSchema7

    if (defSchema.enum) {
      schema.enums.push(convertToEnum(name, defSchema))
    } else if (defSchema.type === 'object' || defSchema.properties) {
      schema.models.push(convertToModel(name, defSchema))
    }
  }

  // If root is an object, add it as a model
  if (jsonSchema.type === 'object' || jsonSchema.properties) {
    const rootName = jsonSchema.title ?? 'Root'
    schema.models.push(convertToModel(rootName, jsonSchema))
  }

  return schema
}

/**
 * Convert JSON Schema to Model
 */
function convertToModel(name: string, schema: JSONSchema7): Model {
  const fields: Field[] = []
  const properties = schema.properties ?? {}
  const required = new Set(schema.required ?? [])

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const field = convertToField(fieldName, fieldSchema as JSONSchema7, required.has(fieldName))
    fields.push(field)
  }

  return {
    name: toPascalCase(name),
    description: schema.description,
    fields,
    crud: createDefaultCrudConfig(),
  }
}

/**
 * Convert JSON Schema property to Field
 */
function convertToField(name: string, schema: JSONSchema7, isRequired: boolean): Field {
  const fieldType = convertToFieldType(schema)
  const validation = extractValidation(schema)

  return {
    name: toCamelCase(name),
    type: fieldType,
    description: schema.description,
    required: isRequired,
    default: schema.default !== undefined ? { kind: 'literal', value: schema.default } : undefined,
    validation: Object.keys(validation).length > 0 ? validation : undefined,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
  }
}

/**
 * Convert JSON Schema to FieldType
 */
function convertToFieldType(schema: JSONSchema7): FieldType {
  // Handle $ref
  if (schema.$ref) {
    const refName = schema.$ref.split('/').pop() ?? ''
    return { kind: 'reference', model: toPascalCase(refName) }
  }

  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    return {
      kind: 'array',
      of: convertToFieldType(schema.items as JSONSchema7),
    }
  }

  // Handle enums
  if (schema.enum) {
    return { kind: 'enum', name: schema.title ?? 'UnknownEnum' }
  }

  // Handle objects with properties
  if (schema.type === 'object' && schema.properties) {
    const fields: Field[] = []
    const required = new Set(schema.required ?? [])

    for (const [name, prop] of Object.entries(schema.properties)) {
      fields.push(convertToField(name, prop as JSONSchema7, required.has(name)))
    }

    return { kind: 'object', fields }
  }

  // Handle union types (oneOf, anyOf)
  if (schema.oneOf || schema.anyOf) {
    const types = (schema.oneOf ?? schema.anyOf) as JSONSchema7[]
    // For simplicity, use the first non-null type
    const firstNonNull = types.find((t) => t.type !== 'null')
    if (firstNonNull) {
      return convertToFieldType(firstNonNull)
    }
  }

  // Map primitive types
  const type = Array.isArray(schema.type)
    ? schema.type.find((t) => t !== 'null') ?? 'string'
    : schema.type ?? 'string'

  const typeMap: Record<string, FieldType> = {
    string: { kind: 'scalar', type: 'string' },
    integer: { kind: 'scalar', type: 'integer' },
    number: { kind: 'scalar', type: 'number' },
    boolean: { kind: 'scalar', type: 'boolean' },
    object: { kind: 'scalar', type: 'json' },
    null: { kind: 'scalar', type: 'string' },
  }

  // Handle format overrides
  if (type === 'string' && schema.format) {
    switch (schema.format) {
      case 'date':
        return { kind: 'scalar', type: 'date' }
      case 'date-time':
        return { kind: 'scalar', type: 'datetime' }
      case 'time':
        return { kind: 'scalar', type: 'time' }
      case 'uuid':
        return { kind: 'scalar', type: 'uuid' }
    }
  }

  return typeMap[type] ?? { kind: 'scalar', type: 'string' }
}

/**
 * Convert JSON Schema to Enum
 */
function convertToEnum(name: string, schema: JSONSchema7): Enum {
  return {
    name: toPascalCase(name),
    description: schema.description,
    values: (schema.enum ?? []).map((value) => ({
      name: String(value).toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      value: value as string | number,
    })),
  }
}

/**
 * Extract validation rules from JSON Schema
 */
function extractValidation(schema: JSONSchema7): ValidationRules {
  const rules: ValidationRules = {}

  // Numeric
  if (schema.minimum !== undefined) rules.min = schema.minimum
  if (schema.maximum !== undefined) rules.max = schema.maximum
  if (schema.exclusiveMinimum !== undefined) rules.min = schema.exclusiveMinimum as number
  if (schema.exclusiveMaximum !== undefined) rules.max = schema.exclusiveMaximum as number
  if (schema.multipleOf !== undefined) rules.multipleOf = schema.multipleOf

  // String
  if (schema.minLength !== undefined) rules.minLength = schema.minLength
  if (schema.maxLength !== undefined) rules.maxLength = schema.maxLength
  if (schema.pattern !== undefined) rules.pattern = schema.pattern

  // Format
  if (schema.format === 'email') rules.email = true
  if (schema.format === 'uri') rules.url = true
  if (schema.format === 'uuid') rules.uuid = true

  // Array
  if (schema.minItems !== undefined) rules.minItems = schema.minItems
  if (schema.maxItems !== undefined) rules.maxItems = schema.maxItems
  if (schema.uniqueItems !== undefined) rules.uniqueItems = schema.uniqueItems

  return rules
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase())
}

function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase())
}

export default jsonSchemaParser
