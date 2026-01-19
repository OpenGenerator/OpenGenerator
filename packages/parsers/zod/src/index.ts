/**
 * @opengenerator/parser-zod
 *
 * Zod schema parser for OpenGenerator
 */

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
  type ValidationRules,
  type Enum,
} from '@opengenerator/core'
import { Project, type SourceFile } from 'ts-morph'
import { type z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'


export { zodParser, createZodParser, parseZodSchema }
export type { ZodParserOptions }

/**
 * Zod parser options
 */
interface ZodParserOptions extends ParserOptions {
  /** Export pattern to look for (e.g., "Schema", "Model") */
  exportPattern?: string
  /** Parse from TypeScript source file */
  parseTypeScript?: boolean
}

/**
 * Create a Zod parser plugin
 */
function createZodParser(options: ZodParserOptions = {}): ParserPlugin {
  return createParserPlugin({
    name: 'zod',
    version: '1.0.0',
    extensions: ['.ts', '.js', '.mjs'],

    canParse(input: string | Buffer, _filePath?: string): boolean {
      const content = typeof input === 'string' ? input : input.toString('utf-8')

      // Check for Zod imports and usage
      return (
        content.includes("from 'zod'") ||
        content.includes('from "zod"') ||
        content.includes('z.object') ||
        content.includes('z.string') ||
        content.includes('z.number')
      )
    },

    async parse(input: string | Buffer, parseOptions?: ParserOptions): Promise<SchemaIR> {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const mergedOptions = { ...options, ...parseOptions }

      try {
        return parseZodFromSource(content, mergedOptions)
      } catch (error) {
        throw new Error(`Failed to parse Zod schema: ${(error as Error).message}`)
      }
    },

    validate(input: string | Buffer) {
      const content = typeof input === 'string' ? input : input.toString('utf-8')
      const errors: Array<{ message: string; severity: 'error' }> = []
      const warnings: Array<{ message: string; severity: 'warning' }> = []

      if (!content.includes('zod')) {
        warnings.push({
          message: 'No Zod import found',
          severity: 'warning',
        })
      }

      if (!content.includes('z.object')) {
        warnings.push({
          message: 'No z.object schemas found',
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
 * Default Zod parser instance
 */
const zodParser = createZodParser

/**
 * Parse Zod schemas from TypeScript source
 */
function parseZodFromSource(source: string, options: ZodParserOptions): SchemaIR {
  const schema = createEmptySchema('zod-schema', 'zod')
  const project = new Project({ useInMemoryFileSystem: true })

  const sourceFile = project.createSourceFile('schema.ts', source)
  const exportPattern = options.exportPattern ?? 'Schema'

  // Find exported Zod schemas
  const exports = sourceFile.getExportedDeclarations()

  for (const [name, declarations] of exports) {
    // Look for schemas matching the pattern
    if (!name.includes(exportPattern)) continue

    for (const decl of declarations) {
      const text = decl.getText()

      // Check if it's a z.object
      if (text.includes('z.object')) {
        const model = parseZodObject(name, text, sourceFile)
        if (model) {
          schema.models.push(model)
        }
      }

      // Check if it's a z.enum
      if (text.includes('z.enum')) {
        const enumDef = parseZodEnum(name, text)
        if (enumDef) {
          schema.enums.push(enumDef)
        }
      }
    }
  }

  return schema
}

/**
 * Parse a Zod object schema from source text
 */
function parseZodObject(name: string, text: string, _sourceFile: SourceFile): Model | null {
  const fields: Field[] = []

  // Extract field definitions using regex (simplified)
  const objectMatch = text.match(/z\.object\s*\(\s*\{([^}]+)\}\s*\)/)
  if (!objectMatch) return null

  const fieldsText = objectMatch[1]
  const fieldPattern = /(\w+)\s*:\s*(z\.[^,}]+)/g
  let match

  while ((match = fieldPattern.exec(fieldsText ?? '')) !== null) {
    const fieldName = match[1]
    const zodType = match[2]

    if (fieldName && zodType) {
      const field = parseZodField(fieldName, zodType)
      if (field) {
        fields.push(field)
      }
    }
  }

  // Clean up the model name
  const modelName = name.replace(/Schema$/, '').replace(/Model$/, '')

  return {
    name: toPascalCase(modelName),
    fields,
    crud: createDefaultCrudConfig(),
  }
}

/**
 * Parse a single Zod field
 */
function parseZodField(name: string, zodType: string): Field {
  const fieldType = parseZodType(zodType)
  const validation = extractZodValidation(zodType)
  const isOptional = zodType.includes('.optional()')
  const isNullable = zodType.includes('.nullable()')

  return {
    name: toCamelCase(name),
    type: fieldType,
    required: !isOptional && !isNullable,
    validation: Object.keys(validation).length > 0 ? validation : undefined,
  }
}

/**
 * Parse Zod type to FieldType
 */
function parseZodType(zodType: string): FieldType {
  // Handle arrays
  if (zodType.includes('z.array(')) {
    const innerMatch = zodType.match(/z\.array\s*\(\s*(z\.[^)]+)\s*\)/)
    if (innerMatch) {
      return {
        kind: 'array',
        of: parseZodType(innerMatch[1] ?? 'z.string()'),
      }
    }
  }

  // Handle enums
  if (zodType.includes('z.enum(')) {
    return { kind: 'enum', name: 'UnknownEnum' }
  }

  // Handle nested objects
  if (zodType.includes('z.object(')) {
    // For simplicity, treat as JSON
    return { kind: 'scalar', type: 'json' }
  }

  // Map primitive types
  if (zodType.includes('z.string')) {
    // Check for specific string formats
    if (zodType.includes('.email()')) {
      return { kind: 'scalar', type: 'string' }
    }
    if (zodType.includes('.uuid()')) {
      return { kind: 'scalar', type: 'uuid' }
    }
    if (zodType.includes('.url()')) {
      return { kind: 'scalar', type: 'string' }
    }
    if (zodType.includes('.datetime()')) {
      return { kind: 'scalar', type: 'datetime' }
    }
    return { kind: 'scalar', type: 'string' }
  }

  if (zodType.includes('z.number')) {
    if (zodType.includes('.int()')) {
      return { kind: 'scalar', type: 'integer' }
    }
    return { kind: 'scalar', type: 'number' }
  }

  if (zodType.includes('z.bigint')) {
    return { kind: 'scalar', type: 'bigint' }
  }

  if (zodType.includes('z.boolean')) {
    return { kind: 'scalar', type: 'boolean' }
  }

  if (zodType.includes('z.date')) {
    return { kind: 'scalar', type: 'datetime' }
  }

  if (zodType.includes('z.any') || zodType.includes('z.unknown')) {
    return { kind: 'scalar', type: 'json' }
  }

  return { kind: 'scalar', type: 'string' }
}

/**
 * Extract validation rules from Zod type chain
 */
function extractZodValidation(zodType: string): ValidationRules {
  const rules: ValidationRules = {}

  // String validations
  const minLengthMatch = zodType.match(/\.min\s*\(\s*(\d+)\s*\)/)
  if (minLengthMatch) {
    rules.minLength = parseInt(minLengthMatch[1] ?? '0', 10)
  }

  const maxLengthMatch = zodType.match(/\.max\s*\(\s*(\d+)\s*\)/)
  if (maxLengthMatch) {
    rules.maxLength = parseInt(maxLengthMatch[1] ?? '0', 10)
  }

  const lengthMatch = zodType.match(/\.length\s*\(\s*(\d+)\s*\)/)
  if (lengthMatch) {
    rules.minLength = parseInt(lengthMatch[1] ?? '0', 10)
    rules.maxLength = parseInt(lengthMatch[1] ?? '0', 10)
  }

  if (zodType.includes('.email()')) {
    rules.email = true
  }

  if (zodType.includes('.url()')) {
    rules.url = true
  }

  if (zodType.includes('.uuid()')) {
    rules.uuid = true
  }

  if (zodType.includes('.trim()')) {
    rules.trim = true
  }

  if (zodType.includes('.toLowerCase()')) {
    rules.toLowerCase = true
  }

  if (zodType.includes('.toUpperCase()')) {
    rules.toUpperCase = true
  }

  // Regex pattern
  const regexMatch = zodType.match(/\.regex\s*\(\s*\/([^/]+)\//)
  if (regexMatch) {
    rules.pattern = regexMatch[1]
  }

  // Number validations
  const minMatch = zodType.match(/\.min\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/)
  if (minMatch && zodType.includes('z.number')) {
    rules.min = parseFloat(minMatch[1] ?? '0')
  }

  const maxMatch = zodType.match(/\.max\s*\(\s*(-?\d+(?:\.\d+)?)\s*\)/)
  if (maxMatch && zodType.includes('z.number')) {
    rules.max = parseFloat(maxMatch[1] ?? '0')
  }

  if (zodType.includes('.positive()')) {
    rules.positive = true
  }

  if (zodType.includes('.negative()')) {
    rules.negative = true
  }

  if (zodType.includes('.int()')) {
    rules.integer = true
  }

  return rules
}

/**
 * Parse a Zod enum
 */
function parseZodEnum(name: string, text: string): Enum | null {
  const match = text.match(/z\.enum\s*\(\s*\[([^\]]+)\]\s*\)/)
  if (!match) return null

  const valuesStr = match[1] ?? ''
  const values = valuesStr
    .split(',')
    .map((v) => v.trim().replace(/['"]/g, ''))
    .filter(Boolean)

  const enumName = name.replace(/Schema$/, '').replace(/Enum$/, '')

  return {
    name: toPascalCase(enumName),
    values: values.map((v) => ({
      name: v.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      value: v,
    })),
  }
}

/**
 * Parse a Zod schema object directly
 */
function parseZodSchema(zodSchema: z.ZodTypeAny, name: string): SchemaIR {
  const schema = createEmptySchema(name, 'zod')
  const jsonSchema = zodToJsonSchema(zodSchema)

  // Convert JSON Schema to our format
  if (typeof jsonSchema === 'object' && 'properties' in jsonSchema) {
    const fields: Field[] = []
    const required = new Set((jsonSchema.required as string[]) ?? [])

    for (const [fieldName, _fieldSchema] of Object.entries(
      jsonSchema.properties as Record<string, unknown>
    )) {
      fields.push({
        name: fieldName,
        type: { kind: 'scalar', type: 'string' }, // Simplified
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

export default zodParser
