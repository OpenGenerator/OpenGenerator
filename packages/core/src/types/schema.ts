/**
 * Universal Schema IR (Intermediate Representation)
 * All parsers convert their input schema to this format
 */

/**
 * Root schema representation
 */
export interface SchemaIR {
  /** IR version for compatibility checking */
  version: '1.0.0'
  /** Schema metadata */
  metadata: SchemaMetadata
  /** Data models */
  models: Model[]
  /** Enum definitions */
  enums: Enum[]
  /** Relationships between models */
  relations: Relation[]
}

/**
 * Schema source metadata
 */
export interface SchemaMetadata {
  /** Schema name */
  name: string
  /** Schema description */
  description?: string
  /** Source schema type */
  source: SchemaSource
  /** Source schema version (e.g., OpenAPI 3.1.0) */
  sourceVersion?: string
  /** Original file path */
  filePath?: string
  /** Generation timestamp */
  generatedAt?: string
}

/**
 * Supported schema sources
 */
export type SchemaSource = 'openapi' | 'prisma' | 'json-schema' | 'zod' | 'typebox' | 'vld'

/**
 * Data model definition
 */
export interface Model {
  /** Model name (PascalCase) */
  name: string
  /** Model description */
  description?: string
  /** Table/collection name override */
  tableName?: string
  /** Model fields */
  fields: Field[]
  /** Database indexes */
  indexes?: Index[]
  /** Unique constraints */
  constraints?: Constraint[]
  /** CRUD operations config */
  crud: CrudConfig
  /** Auth requirements for this model */
  auth?: ModelAuthConfig
  /** Enable soft delete */
  softDelete?: boolean
  /** Add createdAt/updatedAt timestamps */
  timestamps?: boolean
  /** Custom model metadata */
  meta?: Record<string, unknown>
}

/**
 * Field definition
 */
export interface Field {
  /** Field name (camelCase) */
  name: string
  /** Field type */
  type: FieldType
  /** Field description */
  description?: string
  /** Is field required */
  required: boolean
  /** Is field unique */
  unique?: boolean
  /** Is this the primary key */
  primaryKey?: boolean
  /** Default value */
  default?: FieldDefault
  /** Validation rules */
  validation?: ValidationRules
  /** Relation configuration */
  relation?: FieldRelation
  /** Database column name override */
  columnName?: string
  /** Exclude from API responses */
  hidden?: boolean
  /** Field is read-only */
  readOnly?: boolean
  /** Field is write-only (e.g., password) */
  writeOnly?: boolean
  /** Custom field metadata */
  meta?: Record<string, unknown>
}

/**
 * Field type definition
 */
export type FieldType =
  | ScalarFieldType
  | EnumFieldType
  | ArrayFieldType
  | ObjectFieldType
  | ReferenceFieldType

/**
 * Scalar field type
 */
export interface ScalarFieldType {
  kind: 'scalar'
  type: ScalarType
}

/**
 * Supported scalar types
 */
export type ScalarType =
  | 'string'
  | 'number'
  | 'integer'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'time'
  | 'json'
  | 'bigint'
  | 'decimal'
  | 'float'
  | 'bytes'
  | 'uuid'

/**
 * Enum field type
 */
export interface EnumFieldType {
  kind: 'enum'
  /** Reference to enum name */
  name: string
}

/**
 * Array field type
 */
export interface ArrayFieldType {
  kind: 'array'
  /** Element type */
  of: FieldType
}

/**
 * Object/embedded field type
 */
export interface ObjectFieldType {
  kind: 'object'
  /** Nested fields */
  fields: Field[]
}

/**
 * Reference to another model
 */
export interface ReferenceFieldType {
  kind: 'reference'
  /** Referenced model name */
  model: string
}

/**
 * Field default value
 */
export type FieldDefault =
  | { kind: 'literal'; value: unknown }
  | { kind: 'function'; name: 'now' | 'uuid' | 'cuid' | 'autoincrement' | 'dbgenerated' }
  | { kind: 'expression'; expression: string }

/**
 * Validation rules for a field
 */
export interface ValidationRules {
  // Numeric validations
  min?: number
  max?: number
  positive?: boolean
  negative?: boolean
  integer?: boolean
  multipleOf?: number

  // String validations
  minLength?: number
  maxLength?: number
  pattern?: string
  email?: boolean
  url?: boolean
  uuid?: boolean
  cuid?: boolean
  datetime?: boolean
  ip?: boolean
  ipv4?: boolean
  ipv6?: boolean
  trim?: boolean
  toLowerCase?: boolean
  toUpperCase?: boolean

  // Array validations
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean

  // Custom validation
  custom?: string
}

/**
 * Field relation configuration
 */
export interface FieldRelation {
  /** Relation type */
  type: RelationType
  /** Target model name */
  model: string
  /** Target field name */
  field: string
  /** Foreign key field name */
  foreignKey?: string
  /** Relation name (for self-relations) */
  name?: string
}

/**
 * Relation types
 */
export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'

/**
 * Database index definition
 */
export interface Index {
  /** Index name */
  name?: string
  /** Fields included in index */
  fields: IndexField[]
  /** Is unique index */
  unique?: boolean
  /** Index type */
  type?: 'btree' | 'hash' | 'gin' | 'gist' | 'fulltext'
}

/**
 * Index field with optional sort order
 */
export interface IndexField {
  /** Field name */
  name: string
  /** Sort order */
  order?: 'asc' | 'desc'
}

/**
 * Database constraint definition
 */
export interface Constraint {
  /** Constraint type */
  type: 'unique' | 'check' | 'foreignKey'
  /** Constraint name */
  name?: string
  /** Fields involved */
  fields: string[]
  /** Check expression (for check constraints) */
  expression?: string
  /** Reference config (for foreign keys) */
  references?: {
    model: string
    fields: string[]
    onDelete?: CascadeAction
    onUpdate?: CascadeAction
  }
}

/**
 * Cascade action for foreign keys
 */
export type CascadeAction = 'cascade' | 'restrict' | 'set-null' | 'set-default' | 'no-action'

/**
 * CRUD operations configuration
 */
export interface CrudConfig {
  /** Enable create operation */
  create: boolean
  /** Enable read/get operation */
  read: boolean
  /** Enable update operation */
  update: boolean
  /** Enable delete operation */
  delete: boolean
  /** Enable list/find operation */
  list: boolean
  /** Enable bulk create */
  bulkCreate?: boolean
  /** Enable bulk update */
  bulkUpdate?: boolean
  /** Enable bulk delete */
  bulkDelete?: boolean
  /** Enable upsert operation */
  upsert?: boolean
  /** Enable count operation */
  count?: boolean
}

/**
 * Model-level auth configuration
 */
export interface ModelAuthConfig {
  /** Require authentication for all operations */
  required?: boolean
  /** Required roles */
  roles?: string[]
  /** Required permissions */
  permissions?: string[]
  /** Owner field for row-level security */
  ownerField?: string
  /** Operation-specific auth */
  operations?: Partial<Record<keyof CrudConfig, OperationAuth>>
}

/**
 * Operation-level auth configuration
 */
export interface OperationAuth {
  /** Require authentication */
  required?: boolean
  /** Required roles */
  roles?: string[]
  /** Required permissions */
  permissions?: string[]
}

/**
 * Relation definition between models
 */
export interface Relation {
  /** Relation name */
  name: string
  /** Relation type */
  type: RelationType
  /** Source model and field */
  from: {
    model: string
    field: string
  }
  /** Target model and field */
  to: {
    model: string
    field: string
  }
  /** On delete action */
  onDelete?: CascadeAction
  /** On update action */
  onUpdate?: CascadeAction
  /** Join table for many-to-many */
  through?: {
    model: string
    fromField: string
    toField: string
  }
}

/**
 * Enum definition
 */
export interface Enum {
  /** Enum name (PascalCase) */
  name: string
  /** Enum description */
  description?: string
  /** Enum values */
  values: EnumValue[]
}

/**
 * Enum value
 */
export interface EnumValue {
  /** Value name (UPPER_SNAKE_CASE) */
  name: string
  /** Actual value (string or number) */
  value?: string | number
  /** Value description */
  description?: string
}

/**
 * Create default CRUD config (all enabled)
 */
export function createDefaultCrudConfig(): CrudConfig {
  return {
    create: true,
    read: true,
    update: true,
    delete: true,
    list: true,
    bulkCreate: false,
    bulkUpdate: false,
    bulkDelete: false,
    upsert: false,
    count: true,
  }
}

/**
 * Create an empty SchemaIR
 */
export function createEmptySchema(name: string, source: SchemaSource): SchemaIR {
  return {
    version: '1.0.0',
    metadata: {
      name,
      source,
      generatedAt: new Date().toISOString(),
    },
    models: [],
    enums: [],
    relations: [],
  }
}
