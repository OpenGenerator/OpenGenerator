/**
 * OpenGenerator Core Types
 *
 * This module exports all TypeScript interfaces and types used across
 * the OpenGenerator ecosystem.
 */

// Schema IR types
export type {
  SchemaIR,
  SchemaMetadata,
  SchemaSource,
  Model,
  Field,
  FieldType,
  ScalarFieldType,
  ScalarType,
  EnumFieldType,
  ArrayFieldType,
  ObjectFieldType,
  ReferenceFieldType,
  FieldDefault,
  ValidationRules,
  FieldRelation,
  RelationType,
  Index,
  IndexField,
  Constraint,
  CascadeAction,
  CrudConfig,
  ModelAuthConfig,
  OperationAuth,
  Relation,
  Enum,
  EnumValue,
} from './schema'

export { createDefaultCrudConfig, createEmptySchema } from './schema'

// Parser plugin types
export type {
  ParserPlugin,
  ParserOptions,
  ModelTransform,
  FieldTransform,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SourceLocation,
  ParserFactory,
} from './parser'

export { createParserPlugin } from './parser'

// Generator plugin types
export type {
  GeneratorPlugin,
  ApiStyle,
  GeneratorOptions,
  RestOptions,
  PaginationOptions,
  OpenApiOptions,
  GraphQLOptions,
  TrpcOptions,
  CodeStyleOptions,
  FeatureFlags,
  RateLimitOptions,
  LoggingOptions,
  CachingOptions,
  GeneratedCode,
  GeneratedFile,
  Dependency,
  GeneratorFactory,
} from './generator'

export { createGeneratorPlugin, mergeGeneratedCode, mergeDependencies } from './generator'

// Adapter plugin types
export type {
  AdapterPlugin,
  FrameworkType,
  AdapterOptions,
  FrameworkOptions,
  ExpressOptions,
  FastifyOptions,
  HonoOptions,
  KoaOptions,
  StandaloneOptions,
  ServerOptions,
  HttpsOptions,
  MiddlewareOptions,
  MiddlewareDefinition,
  AdapterFactory,
} from './adapter'

export { createAdapterPlugin } from './adapter'

// Auth plugin types
export type {
  AuthPlugin,
  AuthStrategy,
  AuthOptions,
  JwtOptions,
  JwtAlgorithm,
  CookieOptions,
  OAuthOptions,
  OAuthProvider,
  OAuthProviderType,
  SessionOptions,
  SessionStore,
  RedisOptions,
  ApiKeyOptions,
  MagicLinkOptions,
  EmailProvider,
  PasskeyOptions,
  TokenStorageOptions,
  AuthFactory,
} from './auth'

export { createAuthPlugin } from './auth'

// Database plugin types
export type {
  DatabasePlugin,
  DatabaseAdapter,
  DatabaseOptions,
  DatabaseType,
  ConnectionOptions,
  SslOptions,
  PoolOptions,
  MigrationOptions,
  SeedOptions,
  DatabaseLoggingOptions,
  NamingConventions,
  Migration,
  RepositoryMethods,
  QueryOptions,
  DatabaseFactory,
} from './database'

export { createDatabasePlugin } from './database'

// Deploy plugin types
export type {
  DeployPlugin,
  DeployTarget,
  DeployOptions,
  DockerOptions,
  DockerComposeOptions,
  HealthCheckOptions,
  VercelOptions,
  RailwayOptions,
  FlyOptions,
  LambdaOptions,
  KubernetesOptions,
  ProbeConfig,
  IngressConfig,
  HelmOptions,
  DeployValidationResult,
  DeployFactory,
} from './deploy'

export { createDeployPlugin } from './deploy'
