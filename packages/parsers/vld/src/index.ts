/**
 * @opengenerator/parser-vld
 *
 * VLD (Validation Library for Data) schema parser for OpenGenerator.
 * Parses VLD schema definitions and converts them to SchemaIR.
 */

import type {
  ParserPlugin,
  ParserOptions,
  SchemaIR,
  Model,
  Field,
  FieldType,
  Enum,
  Relation,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationRules,
} from '@opengenerator/core'
import { createEmptySchema, createDefaultCrudConfig } from '@opengenerator/core'
import { Project, Node } from 'ts-morph'

export interface VldParserOptions extends ParserOptions {
  /**
   * Custom type mappings for VLD types
   */
  typeMappings?: Record<string, FieldType>

  /**
   * Whether to include validation rules
   */
  includeValidation?: boolean

  /**
   * Whether to extract relations from schema
   */
  extractRelations?: boolean
}

/**
 * VLD method to FieldType mapping
 */
const VLD_TYPE_MAP: Record<string, FieldType> = {
  // Primitives
  string: { kind: 'scalar', type: 'string' },
  str: { kind: 'scalar', type: 'string' },
  text: { kind: 'scalar', type: 'string' },
  number: { kind: 'scalar', type: 'integer' },
  num: { kind: 'scalar', type: 'integer' },
  int: { kind: 'scalar', type: 'integer' },
  integer: { kind: 'scalar', type: 'integer' },
  float: { kind: 'scalar', type: 'float' },
  double: { kind: 'scalar', type: 'float' },
  decimal: { kind: 'scalar', type: 'decimal' },
  boolean: { kind: 'scalar', type: 'boolean' },
  bool: { kind: 'scalar', type: 'boolean' },
  date: { kind: 'scalar', type: 'datetime' },
  datetime: { kind: 'scalar', type: 'datetime' },
  timestamp: { kind: 'scalar', type: 'datetime' },
  time: { kind: 'scalar', type: 'time' },
  json: { kind: 'scalar', type: 'json' },
  object: { kind: 'scalar', type: 'json' },
  any: { kind: 'scalar', type: 'json' },
  bigint: { kind: 'scalar', type: 'bigint' },
  bytes: { kind: 'scalar', type: 'bytes' },
  binary: { kind: 'scalar', type: 'bytes' },
  buffer: { kind: 'scalar', type: 'bytes' },
  uuid: { kind: 'scalar', type: 'uuid' },
  email: { kind: 'scalar', type: 'string' },
  url: { kind: 'scalar', type: 'string' },
  id: { kind: 'scalar', type: 'string' },
}

/**
 * Extract models from VLD schema source
 */
function extractModels(sourceCode: string, options: VldParserOptions): Model[] {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // ESNext
    },
  })

  const sourceFile = project.createSourceFile('schema.ts', sourceCode)
  const models: Model[] = []
  const { typeMappings = {}, includeValidation = true, extractRelations = true } = options

  // Combine default and custom type mappings
  const typeMap = { ...VLD_TYPE_MAP, ...typeMappings }

  // Find VLD schema definitions (v.schema, vld.schema, schema, etc.)
  const variableDeclarations = sourceFile.getVariableDeclarations()

  for (const varDecl of variableDeclarations) {
    const initializer = varDecl.getInitializer()
    if (!initializer) continue

    // Check if it's a VLD schema call
    const schemaInfo = extractSchemaInfo(initializer, typeMap, includeValidation, extractRelations)
    if (schemaInfo) {
      const modelName = varDecl.getName()
      // Convert to PascalCase if needed
      const pascalName = toPascalCase(modelName.replace(/Schema$/, ''))

      models.push({
        name: pascalName,
        tableName: toSnakeCase(pascalName),
        fields: schemaInfo.fields,
        description: extractJsDoc(varDecl),
        crud: createDefaultCrudConfig(),
        meta: schemaInfo.attributes,
      })
    }
  }

  // Also check for exported object patterns
  const exportDeclarations = sourceFile.getExportDeclarations()
  for (const exportDecl of exportDeclarations) {
    const namedExports = exportDecl.getNamedExports()
    for (const named of namedExports) {
      const name = named.getName()
      // Try to find the corresponding variable
      const varDecl = sourceFile.getVariableDeclaration(name)
      if (varDecl) {
        const initializer = varDecl.getInitializer()
        if (!initializer) continue

        const schemaInfo = extractSchemaInfo(
          initializer,
          typeMap,
          includeValidation,
          extractRelations
        )
        if (schemaInfo && !models.find((m) => m.name === name)) {
          const pascalName = toPascalCase(name.replace(/Schema$/, ''))
          models.push({
            name: pascalName,
            tableName: toSnakeCase(pascalName),
            fields: schemaInfo.fields,
            description: extractJsDoc(varDecl),
            crud: createDefaultCrudConfig(),
            meta: schemaInfo.attributes,
          })
        }
      }
    }
  }

  return models
}

/**
 * Extract schema info from an initializer expression
 */
function extractSchemaInfo(
  node: Node,
  typeMap: Record<string, FieldType>,
  includeValidation: boolean,
  extractRelations: boolean
): { fields: Field[]; relations: Relation[]; attributes: Record<string, unknown> } | null {
  const text = node.getText()

  // Check for VLD schema patterns
  const vldPatterns = [
    /v\.schema\s*\(/,
    /vld\.schema\s*\(/,
    /schema\s*\(/,
    /v\.object\s*\(/,
    /vld\.object\s*\(/,
    /createSchema\s*\(/,
    /defineSchema\s*\(/,
  ]

  const isVldSchema = vldPatterns.some((pattern) => pattern.test(text))
  if (!isVldSchema) return null

  const fields: Field[] = []
  const relations: Relation[] = []
  const attributes: Record<string, unknown> = {}

  // Parse the schema object
  if (Node.isCallExpression(node)) {
    const args = node.getArguments()
    if (args.length > 0) {
      const schemaArg = args[0]

      if (Node.isObjectLiteralExpression(schemaArg)) {
        const properties = schemaArg.getProperties()

        for (const prop of properties) {
          if (Node.isPropertyAssignment(prop)) {
            const fieldName = prop.getName()
            const fieldInit = prop.getInitializer()

            if (fieldInit) {
              const fieldInfo = parseFieldDefinition(
                fieldName,
                fieldInit,
                typeMap,
                includeValidation
              )
              if (fieldInfo.field) {
                fields.push(fieldInfo.field)
              }
              if (extractRelations && fieldInfo.relation) {
                relations.push(fieldInfo.relation)
              }
            }
          }
        }
      }
    }
  }

  // Add id field if not present
  if (!fields.find((f) => f.name === 'id')) {
    fields.unshift({
      name: 'id',
      type: { kind: 'scalar', type: 'uuid' },
      required: true,
      unique: true,
      primaryKey: true,
      default: { kind: 'function', name: 'uuid' },
    })
  }

  // Add timestamps if not present
  if (!fields.find((f) => f.name === 'createdAt')) {
    fields.push({
      name: 'createdAt',
      type: { kind: 'scalar', type: 'datetime' },
      required: true,
      default: { kind: 'function', name: 'now' },
    })
  }

  if (!fields.find((f) => f.name === 'updatedAt')) {
    fields.push({
      name: 'updatedAt',
      type: { kind: 'scalar', type: 'datetime' },
      required: true,
      default: { kind: 'function', name: 'now' },
      meta: { updatedAt: true },
    })
  }

  return { fields, relations, attributes }
}

/**
 * Parse a field definition from VLD
 */
function parseFieldDefinition(
  name: string,
  node: Node,
  typeMap: Record<string, FieldType>,
  includeValidation: boolean
): { field: Field | null; relation: Relation | null } {
  const text = node.getText()

  let fieldType: FieldType = { kind: 'scalar', type: 'string' }
  let required = true
  let isArray = false
  let unique = false
  let primaryKey = false
  let defaultValue: unknown = undefined
  const validationRules: ValidationRules = {}
  let relation: Relation | null = null
  let enumName: string | null = null

  // Extract type from VLD chain
  for (const [vldType, schemaType] of Object.entries(typeMap)) {
    const patterns = [
      new RegExp(`v\\.${vldType}\\s*\\(`),
      new RegExp(`vld\\.${vldType}\\s*\\(`),
      new RegExp(`\\.${vldType}\\s*\\(`),
    ]

    if (patterns.some((p) => p.test(text))) {
      fieldType = schemaType
      break
    }
  }

  // Check for optional
  if (/\.optional\s*\(/.test(text) || /\.nullable\s*\(/.test(text)) {
    required = false
  }

  // Check for array
  if (/\.array\s*\(/.test(text) || /v\.array\s*\(/.test(text) || /vld\.array\s*\(/.test(text)) {
    isArray = true
  }

  // Check for unique
  if (/\.unique\s*\(/.test(text)) {
    unique = true
  }

  // Check for id
  if (/\.id\s*\(/.test(text) || name === 'id') {
    primaryKey = true
    unique = true
  }

  // Check for enum
  const enumMatch = text.match(/\.enum\s*\(\s*\[([^\]]+)\]/)
  if (enumMatch && enumMatch[1]) {
    // Create an inline enum name based on field name
    enumName = toPascalCase(name) + 'Enum'
    fieldType = { kind: 'enum', name: enumName }
  }

  // Check for default value
  const defaultMatch = text.match(/\.default\s*\(\s*(['"]?)([^)'"]+)\1\s*\)/)
  if (defaultMatch) {
    defaultValue = defaultMatch[2]
  }

  // Extract validations if enabled
  if (includeValidation) {
    // Min/max for numbers
    const minMatch = text.match(/\.min\s*\(\s*(\d+)\s*\)/)
    if (minMatch && minMatch[1]) {
      const val = parseInt(minMatch[1], 10)
      // Check if it's a string type - use minLength, otherwise min
      if (fieldType.kind === 'scalar' && fieldType.type === 'string') {
        validationRules.minLength = val
      } else {
        validationRules.min = val
      }
    }

    const maxMatch = text.match(/\.max\s*\(\s*(\d+)\s*\)/)
    if (maxMatch && maxMatch[1]) {
      const val = parseInt(maxMatch[1], 10)
      if (fieldType.kind === 'scalar' && fieldType.type === 'string') {
        validationRules.maxLength = val
      } else {
        validationRules.max = val
      }
    }

    // Length (for strings)
    const lengthMatch = text.match(/\.length\s*\(\s*(\d+)\s*\)/)
    if (lengthMatch && lengthMatch[1]) {
      const val = parseInt(lengthMatch[1], 10)
      validationRules.minLength = val
      validationRules.maxLength = val
    }

    // Pattern/regex
    const patternMatch = text.match(/\.pattern\s*\(\s*\/([^/]+)\/([gimsuvy]*)\s*\)/)
    if (patternMatch && patternMatch[1]) {
      validationRules.pattern = patternMatch[1]
    }

    // Email
    if (/\.email\s*\(/.test(text)) {
      validationRules.email = true
      fieldType = { kind: 'scalar', type: 'string' }
    }

    // URL
    if (/\.url\s*\(/.test(text)) {
      validationRules.url = true
      fieldType = { kind: 'scalar', type: 'string' }
    }

    // UUID
    if (/\.uuid\s*\(/.test(text)) {
      validationRules.uuid = true
      fieldType = { kind: 'scalar', type: 'uuid' }
    }

    // Positive/negative
    if (/\.positive\s*\(/.test(text)) {
      validationRules.positive = true
    }
    if (/\.negative\s*\(/.test(text)) {
      validationRules.negative = true
    }

    // Integer
    if (/\.int\s*\(/.test(text) && fieldType.kind === 'scalar' && fieldType.type === 'float') {
      fieldType = { kind: 'scalar', type: 'integer' }
      validationRules.integer = true
    }
  }

  // Check for relation/reference
  const refMatch = text.match(/\.ref\s*\(\s*['"](\w+)['"]\s*\)/)
  if (refMatch && refMatch[1]) {
    const targetModel = refMatch[1]
    relation = {
      name: name,
      type: isArray ? 'one-to-many' : 'many-to-one',
      from: { model: '', field: name },
      to: { model: targetModel, field: 'id' },
    }
    // For relation fields, use reference type
    fieldType = { kind: 'reference', model: targetModel }
  }

  // Wrap in array type if needed
  const finalType: FieldType = isArray ? { kind: 'array', of: fieldType } : fieldType

  const field: Field = {
    name,
    type: finalType,
    required,
    unique: unique || undefined,
    primaryKey: primaryKey || undefined,
    default: defaultValue !== undefined ? { kind: 'literal', value: defaultValue } : undefined,
    validation: Object.keys(validationRules).length > 0 ? validationRules : undefined,
  }

  return { field, relation }
}

/**
 * Extract JSDoc comment from a node
 */
function extractJsDoc(node: Node): string | undefined {
  const jsDocs = node.getLeadingCommentRanges()
  const lastDoc = jsDocs[jsDocs.length - 1]
  if (lastDoc) {
    const text = lastDoc.getText()
    // Clean up JSDoc
    return text
      .replace(/^\/\*\*/, '')
      .replace(/\*\/$/, '')
      .replace(/^\s*\*\s?/gm, '')
      .trim()
  }
  return undefined
}

/**
 * Convert string to PascalCase
 */
function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())
}

/**
 * Convert string to snake_case
 */
function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
}

/**
 * Extract enums from VLD schema
 */
function extractEnums(sourceCode: string): Enum[] {
  const enums: Enum[] = []
  const project = new Project({
    useInMemoryFileSystem: true,
  })

  const sourceFile = project.createSourceFile('schema.ts', sourceCode)

  // Find enum definitions
  const variableDeclarations = sourceFile.getVariableDeclarations()

  for (const varDecl of variableDeclarations) {
    const initializer = varDecl.getInitializer()
    if (!initializer) continue

    const text = initializer.getText()

    // Check for enum patterns
    const enumMatch = text.match(/v\.enum\s*\(\s*\[([^\]]+)\]/)
    if (enumMatch && enumMatch[1]) {
      const name = varDecl.getName()
      const values = enumMatch[1]
        .split(',')
        .map((v) => v.trim().replace(/['"]/g, ''))
        .filter(Boolean)

      enums.push({
        name: toPascalCase(name),
        values: values.map((v) => ({
          name: v,
          value: v,
        })),
        description: extractJsDoc(varDecl),
      })
    }
  }

  return enums
}

/**
 * Create the VLD parser plugin
 */
export function createVldParser(options: VldParserOptions = {}): ParserPlugin {
  return {
    name: '@opengenerator/parser-vld',
    version: '1.0.0',
    extensions: ['.ts', '.js', '.mts', '.mjs'],

    canParse(input: string, filePath?: string): boolean {
      // Check file extension
      if (filePath) {
        const ext = filePath.substring(filePath.lastIndexOf('.'))
        if (!['.ts', '.js', '.mts', '.mjs'].includes(ext)) {
          return false
        }
      }

      // Check for VLD patterns
      const vldPatterns = [
        /import\s+.*from\s+['"]vld['"]/,
        /import\s+.*from\s+['"]@vld\/core['"]/,
        /require\s*\(\s*['"]vld['"]\s*\)/,
        /v\.schema\s*\(/,
        /vld\.schema\s*\(/,
        /v\.object\s*\(/,
        /vld\.object\s*\(/,
        /createSchema\s*\(/,
        /defineSchema\s*\(/,
      ]

      return vldPatterns.some((pattern) => pattern.test(input))
    },

    async parse(input: string, parseOptions?: VldParserOptions): Promise<SchemaIR> {
      const mergedOptions = { ...options, ...parseOptions }

      try {
        const models = extractModels(input, mergedOptions)
        const enums = extractEnums(input)

        // Create the schema using the helper
        const schema = createEmptySchema('vld-schema', 'vld')
        schema.models = models
        schema.enums = enums
        // Relations are collected separately - extractModels returns models without relations property
        schema.relations = []

        return schema
      } catch (error) {
        throw new Error(
          `Failed to parse VLD schema: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    },

    validate(input: string): ValidationResult {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []

      // Check for valid VLD import
      const hasVldImport =
        /import\s+.*from\s+['"]vld['"]/i.test(input) ||
        /import\s+.*from\s+['"]@vld\/core['"]/i.test(input) ||
        /require\s*\(\s*['"]vld['"]\s*\)/i.test(input)

      if (!hasVldImport) {
        warnings.push({
          message: 'No VLD import found. Make sure you have imported VLD.',
          severity: 'warning' as const,
        })
      }

      // Check for schema definitions
      const hasSchemas =
        /v\.schema\s*\(/.test(input) ||
        /vld\.schema\s*\(/.test(input) ||
        /v\.object\s*\(/.test(input) ||
        /vld\.object\s*\(/.test(input)

      if (!hasSchemas) {
        errors.push({
          message: 'No VLD schema definitions found.',
          severity: 'error' as const,
        })
      }

      // Try parsing to catch syntax errors
      try {
        const project = new Project({
          useInMemoryFileSystem: true,
          compilerOptions: {
            target: 99,
            allowJs: true,
          },
        })

        const sourceFile = project.createSourceFile('schema.ts', input)
        const diagnostics = sourceFile.getPreEmitDiagnostics()

        for (const diagnostic of diagnostics) {
          const message = diagnostic.getMessageText()
          const messageStr = typeof message === 'string' ? message : message.getMessageText()
          const lineNumber = diagnostic.getLineNumber()

          if (diagnostic.getCategory() === 1) {
            errors.push({
              message: messageStr,
              severity: 'error' as const,
              location: lineNumber ? { line: lineNumber, column: 1 } : undefined,
            })
          } else {
            warnings.push({
              message: messageStr,
              severity: 'warning' as const,
              location: lineNumber ? { line: lineNumber, column: 1 } : undefined,
            })
          }
        }
      } catch (error) {
        errors.push({
          message: `Syntax error: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'error' as const,
        })
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      }
    },
  }
}

/**
 * Default VLD parser instance
 */
export const vldParser = createVldParser()

export default vldParser
