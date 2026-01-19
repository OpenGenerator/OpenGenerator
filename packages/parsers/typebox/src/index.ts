/**
 * @opengenerator/parser-typebox
 *
 * TypeBox schema parser for OpenGenerator
 */

import { type TSchema, type TObject, type TArray } from '@sinclair/typebox'
import { Project } from 'ts-morph'

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

export { typeboxParser, createTypeboxParser, parseTypeboxSchema }
export type { TypeboxParserOptions }

/**
 * TypeBox parser options
 */
interface TypeboxParserOptions extends ParserOptions {
  /** Export pattern to look for */
  exportPattern?: string
}

/**
 * Create a TypeBox parser plugin
 */
function createTypeboxParser(options: TypeboxParserOptions = {}): ParserPlugin {
  return createParserPlugin({
    name: 'typebox',
    version: '1.0.0',
    extensions: ['.ts', '.js', '.mjs'],

    canParse(input: string | Buffer, _filePath?: string): boolean {
      const content = typeof input === 'string' ? input : input.toString('utf-8')

      return (
        content.includes('@sinclair/typebox') ||
        content.includes('Type.Object') ||
        content.includes('Type.String')
      )
    },

    async parse(input: string | Buffer, parseOptions?: ParserOptions): Promise<SchemaIR> {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const mergedOptions = { ...options, ...parseOptions }

      try {
        return parseTypeboxFromSource(content, mergedOptions)
      } catch (error) {
        throw new Error(`Failed to parse TypeBox schema: ${(error as Error).message}`)
      }
    },

    validate(input: string | Buffer) {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const errors: Array<{ message: string; severity: 'error' }> = []
      const warnings: Array<{ message: string; severity: 'warning' }> = []

      if (!content.includes('typebox') && !content.includes('Type.')) {
        warnings.push({
          message: 'No TypeBox import or usage found',
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
 * Default TypeBox parser instance
 */
const typeboxParser = createTypeboxParser

/**
 * Parse TypeBox schemas from source code
 */
function parseTypeboxFromSource(source: string, options: TypeboxParserOptions): SchemaIR {
  const schema = createEmptySchema('typebox-schema', 'typebox')
  const project = new Project({ useInMemoryFileSystem: true })
  const sourceFile = project.createSourceFile('schema.ts', source)
  const exportPattern = options.exportPattern ?? 'Schema'

  const exports = sourceFile.getExportedDeclarations()

  for (const [name, declarations] of exports) {
    if (!name.includes(exportPattern)) continue

    for (const decl of declarations) {
      const text = decl.getText()

      if (text.includes('Type.Object')) {
        const model = parseTypeboxObject(name, text)
        if (model) {
          schema.models.push(model)
        }
      }

      if (text.includes('Type.Enum') || text.includes('Type.Union')) {
        const enumDef = parseTypeboxEnum(name, text)
        if (enumDef) {
          schema.enums.push(enumDef)
        }
      }
    }
  }

  return schema
}

/**
 * Parse TypeBox object
 */
function parseTypeboxObject(name: string, text: string): Model | null {
  const fields: Field[] = []

  const objectMatch = text.match(/Type\.Object\s*\(\s*\{([^}]+)\}\s*/)
  if (!objectMatch) return null

  const fieldsText = objectMatch[1]
  const fieldPattern = /(\w+)\s*:\s*(Type\.[^,}]+)/g
  let match

  while ((match = fieldPattern.exec(fieldsText ?? '')) !== null) {
    const fieldName = match[1]
    const typeboxType = match[2]

    if (fieldName && typeboxType) {
      const field = parseTypeboxField(fieldName, typeboxType)
      if (field) {
        fields.push(field)
      }
    }
  }

  const modelName = name.replace(/Schema$/, '')

  return {
    name: toPascalCase(modelName),
    fields,
    crud: createDefaultCrudConfig(),
  }
}

/**
 * Parse TypeBox field
 */
function parseTypeboxField(name: string, typeboxType: string): Field {
  const fieldType = parseTypeboxType(typeboxType)
  const validation = extractTypeboxValidation(typeboxType)
  const isOptional = typeboxType.includes('Type.Optional')

  return {
    name: toCamelCase(name),
    type: fieldType,
    required: !isOptional,
    validation: Object.keys(validation).length > 0 ? validation : undefined,
  }
}

/**
 * Parse TypeBox type to FieldType
 */
function parseTypeboxType(typeboxType: string): FieldType {
  if (typeboxType.includes('Type.Array')) {
    const innerMatch = typeboxType.match(/Type\.Array\s*\(\s*(Type\.[^)]+)\s*\)/)
    if (innerMatch) {
      return {
        kind: 'array',
        of: parseTypeboxType(innerMatch[1] ?? 'Type.String()'),
      }
    }
  }

  if (typeboxType.includes('Type.Object')) {
    return { kind: 'scalar', type: 'json' }
  }

  // Map primitive types
  if (typeboxType.includes('Type.String')) {
    if (typeboxType.includes('format')) {
      if (typeboxType.includes("'email'")) return { kind: 'scalar', type: 'string' }
      if (typeboxType.includes("'uuid'")) return { kind: 'scalar', type: 'uuid' }
      if (typeboxType.includes("'date-time'")) return { kind: 'scalar', type: 'datetime' }
      if (typeboxType.includes("'date'")) return { kind: 'scalar', type: 'date' }
      if (typeboxType.includes("'time'")) return { kind: 'scalar', type: 'time' }
    }
    return { kind: 'scalar', type: 'string' }
  }

  if (typeboxType.includes('Type.Number')) {
    return { kind: 'scalar', type: 'number' }
  }

  if (typeboxType.includes('Type.Integer')) {
    return { kind: 'scalar', type: 'integer' }
  }

  if (typeboxType.includes('Type.Boolean')) {
    return { kind: 'scalar', type: 'boolean' }
  }

  if (typeboxType.includes('Type.Any') || typeboxType.includes('Type.Unknown')) {
    return { kind: 'scalar', type: 'json' }
  }

  if (typeboxType.includes('Type.Null')) {
    return { kind: 'scalar', type: 'string' }
  }

  return { kind: 'scalar', type: 'string' }
}

/**
 * Extract validation from TypeBox type
 */
function extractTypeboxValidation(typeboxType: string): ValidationRules {
  const rules: ValidationRules = {}

  const minLengthMatch = typeboxType.match(/minLength\s*:\s*(\d+)/)
  if (minLengthMatch) rules.minLength = parseInt(minLengthMatch[1] ?? '0', 10)

  const maxLengthMatch = typeboxType.match(/maxLength\s*:\s*(\d+)/)
  if (maxLengthMatch) rules.maxLength = parseInt(maxLengthMatch[1] ?? '0', 10)

  const minMatch = typeboxType.match(/minimum\s*:\s*(-?\d+(?:\.\d+)?)/)
  if (minMatch) rules.min = parseFloat(minMatch[1] ?? '0')

  const maxMatch = typeboxType.match(/maximum\s*:\s*(-?\d+(?:\.\d+)?)/)
  if (maxMatch) rules.max = parseFloat(maxMatch[1] ?? '0')

  const patternMatch = typeboxType.match(/pattern\s*:\s*['"]([^'"]+)['"]/)
  if (patternMatch) rules.pattern = patternMatch[1]

  if (typeboxType.includes("format: 'email'")) rules.email = true
  if (typeboxType.includes("format: 'uri'")) rules.url = true
  if (typeboxType.includes("format: 'uuid'")) rules.uuid = true

  return rules
}

/**
 * Parse TypeBox enum
 */
function parseTypeboxEnum(name: string, text: string): Enum | null {
  // Handle Type.Union([Type.Literal(...)])
  const unionMatch = text.match(/Type\.Union\s*\(\s*\[([^\]]+)\]\s*\)/)
  if (unionMatch) {
    const literals = (unionMatch[1] ?? '')
      .split('Type.Literal')
      .slice(1)
      .map((lit) => {
        const match = lit.match(/\(['"]([^'"]+)['"]\)/)
        return match?.[1]
      })
      .filter(Boolean) as string[]

    if (literals.length > 0) {
      return {
        name: toPascalCase(name.replace(/Schema$/, '')),
        values: literals.map((v) => ({
          name: v.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
          value: v,
        })),
      }
    }
  }

  return null
}

/**
 * Parse TypeBox schema directly
 */
function parseTypeboxSchema(typeboxSchema: TSchema, name: string): SchemaIR {
  const schema = createEmptySchema(name, 'typebox')

  if ('properties' in typeboxSchema) {
    const fields: Field[] = []
    const required = new Set((typeboxSchema as TObject).required ?? [])

    for (const [fieldName, fieldSchema] of Object.entries(
      (typeboxSchema as TObject).properties
    )) {
      fields.push({
        name: fieldName,
        type: convertTypeboxSchemaToFieldType(fieldSchema),
        required: required.has(fieldName),
      })
    }

    schema.models.push({
      name: toPascalCase(name),
      fields,
      crud: createDefaultCrudConfig(),
    })
  }

  return schema
}

/**
 * Convert TypeBox schema to FieldType
 */
function convertTypeboxSchemaToFieldType(schema: TSchema): FieldType {
  const kind = (schema as { type?: string }).type

  switch (kind) {
    case 'string':
      return { kind: 'scalar', type: 'string' }
    case 'number':
      return { kind: 'scalar', type: 'number' }
    case 'integer':
      return { kind: 'scalar', type: 'integer' }
    case 'boolean':
      return { kind: 'scalar', type: 'boolean' }
    case 'array':
      return {
        kind: 'array',
        of: convertTypeboxSchemaToFieldType((schema as TArray).items),
      }
    case 'object':
      return { kind: 'scalar', type: 'json' }
    default:
      return { kind: 'scalar', type: 'string' }
  }
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

export default typeboxParser
