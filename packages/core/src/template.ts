import Handlebars from 'handlebars'

import type { SchemaIR, Model, Field, FieldType, Enum } from './types'

/**
 * Template context passed to Handlebars templates
 */
export interface TemplateContext {
  /** Schema data */
  schema: SchemaIR
  /** Current model (if rendering model-specific template) */
  model?: Model
  /** Current enum (if rendering enum-specific template) */
  enum?: Enum
  /** Generation options */
  options: Record<string, unknown>
  /** Helper data */
  helpers: {
    timestamp: string
    version: string
  }
}

/**
 * Template engine for code generation
 */
export class TemplateEngine {
  private handlebars: typeof Handlebars
  private templates: Map<string, Handlebars.TemplateDelegate> = new Map()

  constructor() {
    this.handlebars = Handlebars.create()
    this.registerBuiltinHelpers()
  }

  /**
   * Register built-in Handlebars helpers
   */
  private registerBuiltinHelpers(): void {
    // String manipulation
    this.handlebars.registerHelper('camelCase', (str: string) => this.toCamelCase(str))
    this.handlebars.registerHelper('pascalCase', (str: string) => this.toPascalCase(str))
    this.handlebars.registerHelper('snakeCase', (str: string) => this.toSnakeCase(str))
    this.handlebars.registerHelper('kebabCase', (str: string) => this.toKebabCase(str))
    this.handlebars.registerHelper('upperCase', (str: string) => str.toUpperCase())
    this.handlebars.registerHelper('lowerCase', (str: string) => str.toLowerCase())
    this.handlebars.registerHelper('capitalize', (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1)
    )
    this.handlebars.registerHelper('plural', (str: string) => this.pluralize(str))
    this.handlebars.registerHelper('singular', (str: string) => this.singularize(str))

    // Type conversion
    this.handlebars.registerHelper('tsType', (type: FieldType) => this.toTypeScriptType(type))
    this.handlebars.registerHelper('jsonType', (type: FieldType) => this.toJsonSchemaType(type))
    this.handlebars.registerHelper('dbType', (type: FieldType, db: string) =>
      this.toDatabaseType(type, db)
    )

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b)
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b)
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b)
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b)
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b)
    this.handlebars.registerHelper('and', (...args: unknown[]) =>
      args.slice(0, -1).every(Boolean)
    )
    this.handlebars.registerHelper('or', (...args: unknown[]) =>
      args.slice(0, -1).some(Boolean)
    )
    this.handlebars.registerHelper('not', (value: unknown) => !value)

    // Array helpers
    this.handlebars.registerHelper('first', (arr: unknown[]) => arr?.[0])
    this.handlebars.registerHelper('last', (arr: unknown[]) => arr?.[arr.length - 1])
    this.handlebars.registerHelper('length', (arr: unknown[]) => arr?.length ?? 0)
    this.handlebars.registerHelper('join', (arr: unknown[], separator: string) =>
      arr?.join(separator) ?? ''
    )
    this.handlebars.registerHelper('includes', (arr: unknown[], item: unknown) =>
      arr?.includes(item) ?? false
    )

    // Object helpers
    this.handlebars.registerHelper('json', (obj: unknown) => JSON.stringify(obj, null, 2))
    this.handlebars.registerHelper('keys', (obj: Record<string, unknown>) =>
      Object.keys(obj ?? {})
    )
    this.handlebars.registerHelper('values', (obj: Record<string, unknown>) =>
      Object.values(obj ?? {})
    )

    // Code formatting
    this.handlebars.registerHelper('indent', (str: string, spaces: number) => {
      const indent = ' '.repeat(spaces)
      return str.split('\n').map((line) => indent + line).join('\n')
    })
    this.handlebars.registerHelper('quote', (str: string) => `'${str}'`)
    this.handlebars.registerHelper('doubleQuote', (str: string) => `"${str}"`)
    this.handlebars.registerHelper('backtick', (str: string) => `\`${str}\``)

    // Field helpers
    this.handlebars.registerHelper('isRequired', (field: Field) => field.required)
    this.handlebars.registerHelper('isOptional', (field: Field) => !field.required)
    this.handlebars.registerHelper('isScalar', (type: FieldType) => type.kind === 'scalar')
    this.handlebars.registerHelper('isEnum', (type: FieldType) => type.kind === 'enum')
    this.handlebars.registerHelper('isArray', (type: FieldType) => type.kind === 'array')
    this.handlebars.registerHelper('isObject', (type: FieldType) => type.kind === 'object')
    this.handlebars.registerHelper('isReference', (type: FieldType) => type.kind === 'reference')
    this.handlebars.registerHelper('hasRelation', (field: Field) => !!field.relation)

    // Model helpers
    this.handlebars.registerHelper('getPrimaryKey', (model: Model) =>
      model.fields.find((f) => f.primaryKey)
    )
    this.handlebars.registerHelper('getRequiredFields', (model: Model) =>
      model.fields.filter((f) => f.required)
    )
    this.handlebars.registerHelper('getOptionalFields', (model: Model) =>
      model.fields.filter((f) => !f.required)
    )
    this.handlebars.registerHelper('getRelationFields', (model: Model) =>
      model.fields.filter((f) => f.relation)
    )

    // Block helpers
    this.handlebars.registerHelper('ifCrud', function(
      this: { crud?: Record<string, boolean> },
      operation: string,
      options: Handlebars.HelperOptions
    ) {
      if (this.crud?.[operation]) {
        return options.fn(this)
      }
      return options.inverse(this)
    })

    this.handlebars.registerHelper('each_with_index', function(
      arr: unknown[],
      options: Handlebars.HelperOptions
    ) {
      let result = ''
      for (let i = 0; i < arr.length; i++) {
        result += options.fn({ ...arr[i] as object, _index: i, _first: i === 0, _last: i === arr.length - 1 })
      }
      return result
    })
  }

  /**
   * Register a custom helper
   */
  registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
    this.handlebars.registerHelper(name, fn)
  }

  /**
   * Register a partial template
   */
  registerPartial(name: string, template: string): void {
    this.handlebars.registerPartial(name, template)
  }

  /**
   * Compile a template string
   */
  compile(template: string, name?: string): Handlebars.TemplateDelegate {
    const compiled = this.handlebars.compile(template)
    if (name) {
      this.templates.set(name, compiled)
    }
    return compiled
  }

  /**
   * Render a template with context
   */
  render(template: string | Handlebars.TemplateDelegate, context: TemplateContext): string {
    const compiled = typeof template === 'string' ? this.compile(template) : template
    return compiled(context)
  }

  /**
   * Render a named template
   */
  renderNamed(name: string, context: TemplateContext): string {
    const template = this.templates.get(name)
    if (!template) {
      throw new Error(`Template '${name}' not found`)
    }
    return template(context)
  }

  /**
   * Get a compiled template by name
   */
  getTemplate(name: string): Handlebars.TemplateDelegate | undefined {
    return this.templates.get(name)
  }

  /**
   * Check if a template exists
   */
  hasTemplate(name: string): boolean {
    return this.templates.has(name)
  }

  /**
   * Convert string to camelCase
   */
  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
        index === 0 ? letter.toLowerCase() : letter.toUpperCase()
      )
      .replace(/[\s_-]+/g, '')
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
      .replace(/[\s_-]+/g, '')
  }

  /**
   * Convert string to snake_case
   */
  private toSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s-]+/g, '_')
      .toLowerCase()
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  }

  /**
   * Simple pluralization
   */
  private pluralize(str: string): string {
    if (str.endsWith('y')) {
      return str.slice(0, -1) + 'ies'
    }
    if (str.endsWith('s') || str.endsWith('x') || str.endsWith('ch') || str.endsWith('sh')) {
      return str + 'es'
    }
    return str + 's'
  }

  /**
   * Simple singularization
   */
  private singularize(str: string): string {
    if (str.endsWith('ies')) {
      return str.slice(0, -3) + 'y'
    }
    if (str.endsWith('es')) {
      return str.slice(0, -2)
    }
    if (str.endsWith('s')) {
      return str.slice(0, -1)
    }
    return str
  }

  /**
   * Convert field type to TypeScript type
   */
  private toTypeScriptType(type: FieldType): string {
    switch (type.kind) {
      case 'scalar':
        switch (type.type) {
          case 'string':
          case 'uuid':
            return 'string'
          case 'number':
          case 'integer':
          case 'float':
          case 'decimal':
            return 'number'
          case 'bigint':
            return 'bigint'
          case 'boolean':
            return 'boolean'
          case 'date':
          case 'datetime':
          case 'time':
            return 'Date'
          case 'json':
            return 'Record<string, unknown>'
          case 'bytes':
            return 'Buffer'
          default:
            return 'unknown'
        }
      case 'enum':
        return type.name
      case 'array':
        return `${this.toTypeScriptType(type.of)}[]`
      case 'object':
        return '{ ' + type.fields.map((f) =>
          `${f.name}${f.required ? '' : '?'}: ${this.toTypeScriptType(f.type)}`
        ).join('; ') + ' }'
      case 'reference':
        return type.model
      default:
        return 'unknown'
    }
  }

  /**
   * Convert field type to JSON Schema type
   */
  private toJsonSchemaType(type: FieldType): string {
    switch (type.kind) {
      case 'scalar':
        switch (type.type) {
          case 'string':
          case 'uuid':
          case 'date':
          case 'datetime':
          case 'time':
            return 'string'
          case 'number':
          case 'float':
          case 'decimal':
            return 'number'
          case 'integer':
          case 'bigint':
            return 'integer'
          case 'boolean':
            return 'boolean'
          case 'json':
            return 'object'
          case 'bytes':
            return 'string'
          default:
            return 'string'
        }
      case 'enum':
        return 'string'
      case 'array':
        return 'array'
      case 'object':
        return 'object'
      case 'reference':
        return 'string'
      default:
        return 'string'
    }
  }

  /**
   * Convert field type to database type
   */
  private toDatabaseType(type: FieldType, db: string): string {
    if (type.kind !== 'scalar') {
      return 'TEXT'
    }

    const typeMap: Record<string, Record<string, string>> = {
      postgresql: {
        string: 'TEXT',
        number: 'DOUBLE PRECISION',
        integer: 'INTEGER',
        bigint: 'BIGINT',
        float: 'REAL',
        decimal: 'DECIMAL',
        boolean: 'BOOLEAN',
        date: 'DATE',
        datetime: 'TIMESTAMP',
        time: 'TIME',
        json: 'JSONB',
        uuid: 'UUID',
        bytes: 'BYTEA',
      },
      mysql: {
        string: 'VARCHAR(255)',
        number: 'DOUBLE',
        integer: 'INT',
        bigint: 'BIGINT',
        float: 'FLOAT',
        decimal: 'DECIMAL(10,2)',
        boolean: 'TINYINT(1)',
        date: 'DATE',
        datetime: 'DATETIME',
        time: 'TIME',
        json: 'JSON',
        uuid: 'VARCHAR(36)',
        bytes: 'BLOB',
      },
      sqlite: {
        string: 'TEXT',
        number: 'REAL',
        integer: 'INTEGER',
        bigint: 'INTEGER',
        float: 'REAL',
        decimal: 'REAL',
        boolean: 'INTEGER',
        date: 'TEXT',
        datetime: 'TEXT',
        time: 'TEXT',
        json: 'TEXT',
        uuid: 'TEXT',
        bytes: 'BLOB',
      },
    }

    return typeMap[db]?.[type.type] ?? 'TEXT'
  }
}

/**
 * Create a new template engine instance
 */
export function createTemplateEngine(): TemplateEngine {
  return new TemplateEngine()
}

/**
 * Global template engine instance
 */
export const templateEngine = createTemplateEngine()
