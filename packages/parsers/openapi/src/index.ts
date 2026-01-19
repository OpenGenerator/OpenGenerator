/**
 * @opengenerator/parser-openapi
 *
 * OpenAPI 3.0/3.1 schema parser for OpenGenerator
 */

import YAML from 'yaml'
import $RefParser from '@apidevtools/json-schema-ref-parser'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

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

export { openApiParser, createOpenApiParser }
export type { OpenApiParserOptions }

type OpenApiDocument = OpenAPIV3.Document | OpenAPIV3_1.Document
type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject

/**
 * OpenAPI parser options
 */
interface OpenApiParserOptions extends ParserOptions {
  /** Dereference $ref pointers */
  dereference?: boolean
  /** Extract models from request/response bodies */
  extractFromOperations?: boolean
}

/**
 * Create an OpenAPI parser plugin
 */
function createOpenApiParser(options: OpenApiParserOptions = {}): ParserPlugin {
  return createParserPlugin({
    name: 'openapi',
    version: '1.0.0',
    extensions: ['.yaml', '.yml', '.json'],

    canParse(input: string | Buffer, _filePath?: string): boolean {
      const content = typeof input === 'string' ? input : input.toString('utf-8')

      // Check for OpenAPI indicators
      if (content.includes('openapi:') || content.includes('"openapi"')) {
        return true
      }

      // Check for swagger (OpenAPI 2.0)
      if (content.includes('swagger:') || content.includes('"swagger"')) {
        return true
      }

      return false
    },

    async parse(input: string | Buffer, parseOptions?: ParserOptions): Promise<SchemaIR> {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const mergedOptions = { ...options, ...parseOptions }

      try {
        // Parse YAML or JSON
        let doc: OpenApiDocument
        if (content.trim().startsWith('{')) {
          doc = JSON.parse(content) as OpenApiDocument
        } else {
          doc = YAML.parse(content) as OpenApiDocument
        }

        // Dereference if requested
        if (mergedOptions.dereference !== false) {
          doc = await $RefParser.dereference(doc) as OpenApiDocument
        }

        return convertToSchemaIR(doc, mergedOptions)
      } catch (error) {
        throw new Error(`Failed to parse OpenAPI schema: ${(error as Error).message}`)
      }
    },

    validate(input: string | Buffer) {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const errors: Array<{ message: string; severity: 'error' }> = []
      const warnings: Array<{ message: string; severity: 'warning' }> = []

      try {
        const doc = content.trim().startsWith('{')
          ? JSON.parse(content)
          : YAML.parse(content)

        if (!doc.openapi && !doc.swagger) {
          errors.push({
            message: 'Missing openapi or swagger version field',
            severity: 'error',
          })
        }

        if (!doc.info) {
          warnings.push({
            message: 'Missing info section',
            severity: 'warning',
          })
        }

        if (!doc.paths && !doc.components?.schemas) {
          warnings.push({
            message: 'No paths or schemas defined',
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
 * Default OpenAPI parser instance
 */
const openApiParser = createOpenApiParser

/**
 * Convert OpenAPI document to SchemaIR
 */
function convertToSchemaIR(doc: OpenApiDocument, _options: OpenApiParserOptions): SchemaIR {
  const schema = createEmptySchema(doc.info?.title ?? 'openapi-schema', 'openapi')
  schema.metadata.sourceVersion = doc.openapi ?? (doc as { swagger?: string }).swagger
  schema.metadata.description = doc.info?.description

  const schemas = (doc.components?.schemas ?? {}) as Record<string, SchemaObject>

  // Process schemas
  for (const [name, schemaObj] of Object.entries(schemas)) {
    if (schemaObj.type === 'object' || schemaObj.properties) {
      schema.models.push(convertSchemaToModel(name, schemaObj))
    } else if (schemaObj.enum) {
      schema.enums.push(convertSchemaToEnum(name, schemaObj))
    }
  }

  return schema
}

/**
 * Convert OpenAPI schema to Model
 */
function convertSchemaToModel(name: string, schemaObj: SchemaObject): Model {
  const fields: Field[] = []
  const properties = schemaObj.properties ?? {}
  const required = new Set(schemaObj.required ?? [])

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const field = convertPropertyToField(fieldName, fieldSchema as SchemaObject, required.has(fieldName))
    if (field) {
      fields.push(field)
    }
  }

  return {
    name: toPascalCase(name),
    description: schemaObj.description,
    fields,
    crud: createDefaultCrudConfig(),
  }
}

/**
 * Convert OpenAPI property to Field
 */
function convertPropertyToField(
  name: string,
  schema: SchemaObject,
  isRequired: boolean
): Field {
  const fieldType = convertSchemaToFieldType(schema)
  const validation = extractValidationRules(schema)

  return {
    name: toCamelCase(name),
    type: fieldType,
    description: schema.description,
    required: isRequired,
    validation: Object.keys(validation).length > 0 ? validation : undefined,
    readOnly: schema.readOnly,
    writeOnly: schema.writeOnly,
  }
}

/**
 * Convert OpenAPI schema to FieldType
 */
function convertSchemaToFieldType(schema: SchemaObject): FieldType {
  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    return {
      kind: 'array',
      of: convertSchemaToFieldType(schema.items as SchemaObject),
    }
  }

  // Handle enums
  if (schema.enum) {
    return { kind: 'enum', name: schema.title ?? 'UnknownEnum' }
  }

  // Handle $ref
  if ('$ref' in schema && schema.$ref) {
    const refName = (schema.$ref as string).split('/').pop() ?? ''
    return { kind: 'reference', model: toPascalCase(refName) }
  }

  // Handle objects
  if (schema.type === 'object' && schema.properties) {
    const fields: Field[] = []
    const required = new Set(schema.required ?? [])

    for (const [name, prop] of Object.entries(schema.properties)) {
      fields.push(convertPropertyToField(name, prop as SchemaObject, required.has(name)))
    }

    return { kind: 'object', fields }
  }

  // Handle primitives
  const typeMap: Record<string, FieldType> = {
    string: { kind: 'scalar', type: 'string' },
    integer: { kind: 'scalar', type: 'integer' },
    number: { kind: 'scalar', type: 'number' },
    boolean: { kind: 'scalar', type: 'boolean' },
    object: { kind: 'scalar', type: 'json' },
  }

  // Handle format overrides
  if (schema.type === 'string') {
    switch (schema.format) {
      case 'date':
        return { kind: 'scalar', type: 'date' }
      case 'date-time':
        return { kind: 'scalar', type: 'datetime' }
      case 'time':
        return { kind: 'scalar', type: 'time' }
      case 'uuid':
        return { kind: 'scalar', type: 'uuid' }
      case 'byte':
      case 'binary':
        return { kind: 'scalar', type: 'bytes' }
    }
  }

  if (schema.type === 'integer' && schema.format === 'int64') {
    return { kind: 'scalar', type: 'bigint' }
  }

  return typeMap[schema.type as string] ?? { kind: 'scalar', type: 'string' }
}

/**
 * Convert OpenAPI schema to Enum
 */
function convertSchemaToEnum(name: string, schema: SchemaObject): Enum {
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
 * Extract validation rules from OpenAPI schema
 */
function extractValidationRules(schema: SchemaObject): ValidationRules {
  const rules: ValidationRules = {}

  // Numeric validations
  if (schema.minimum !== undefined) rules.min = schema.minimum
  if (schema.maximum !== undefined) rules.max = schema.maximum
  if (schema.multipleOf !== undefined) rules.multipleOf = schema.multipleOf
  if (schema.exclusiveMinimum !== undefined) rules.min = schema.exclusiveMinimum as number
  if (schema.exclusiveMaximum !== undefined) rules.max = schema.exclusiveMaximum as number

  // String validations
  if (schema.minLength !== undefined) rules.minLength = schema.minLength
  if (schema.maxLength !== undefined) rules.maxLength = schema.maxLength
  if (schema.pattern !== undefined) rules.pattern = schema.pattern

  // Format-based validations
  if (schema.format === 'email') rules.email = true
  if (schema.format === 'uri' || schema.format === 'url') rules.url = true
  if (schema.format === 'uuid') rules.uuid = true

  // Array validations
  if (schema.minItems !== undefined) rules.minItems = schema.minItems
  if (schema.maxItems !== undefined) rules.maxItems = schema.maxItems
  if (schema.uniqueItems !== undefined) rules.uniqueItems = schema.uniqueItems

  return rules
}

/**
 * Convert to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase())
}

/**
 * Convert to camelCase
 */
function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase())
}

// Default export
export default openApiParser
