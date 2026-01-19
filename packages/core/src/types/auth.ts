import type { Dependency, GeneratedCode, GeneratedFile, GeneratorOptions } from './generator'
import type { MiddlewareDefinition } from './adapter'
import type { SchemaIR } from './schema'

/**
 * Auth plugin interface
 * Auth plugins generate authentication/authorization code
 */
export interface AuthPlugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Auth strategy type */
  strategy: AuthStrategy
  /** Auth priority (higher runs first) */
  priority?: number

  /**
   * Generate auth code
   * @param schema - Parsed schema (for user model detection)
   * @param options - Auth options
   */
  generate(schema: SchemaIR, options: AuthOptions): Promise<GeneratedCode>

  /**
   * Get middleware definitions for protecting routes
   */
  getMiddleware(): MiddlewareDefinition[]

  /**
   * Get required dependencies
   */
  getDependencies(): Dependency[]

  /**
   * Get peer dependencies
   */
  getPeerDependencies?(): Dependency[]

  /**
   * Generate auth routes (login, logout, etc.)
   */
  generateRoutes?(options: AuthOptions): GeneratedFile[]
}

/**
 * Supported auth strategies
 */
export type AuthStrategy = 'jwt' | 'oauth' | 'session' | 'apikey' | 'magic-link' | 'passkey'

/**
 * Auth plugin options
 */
export interface AuthOptions extends GeneratorOptions {
  /** Auth strategies to use */
  strategies?: AuthStrategy[]
  /** JWT options */
  jwt?: JwtOptions
  /** OAuth options */
  oauth?: OAuthOptions
  /** Session options */
  session?: SessionOptions
  /** API key options */
  apikey?: ApiKeyOptions
  /** Magic link options */
  magicLink?: MagicLinkOptions
  /** Passkey options */
  passkey?: PasskeyOptions
  /** User model name */
  userModel?: string
  /** Token storage */
  tokenStorage?: TokenStorageOptions
  /** Route prefix */
  routePrefix?: string
}

/**
 * JWT auth options
 */
export interface JwtOptions {
  /** Access token expiry */
  accessTokenExpiry?: string
  /** Refresh token expiry */
  refreshTokenExpiry?: string
  /** JWT algorithm */
  algorithm?: JwtAlgorithm
  /** JWT issuer */
  issuer?: string
  /** JWT audience */
  audience?: string
  /** Secret key (for HMAC) */
  secret?: string
  /** Public key path (for RSA/EC) */
  publicKeyPath?: string
  /** Private key path (for RSA/EC) */
  privateKeyPath?: string
  /** Cookie-based JWT */
  cookies?: boolean
  /** Cookie options */
  cookieOptions?: CookieOptions
  /** Refresh token rotation */
  rotateRefreshTokens?: boolean
}

/**
 * JWT algorithms
 */
export type JwtAlgorithm =
  | 'HS256'
  | 'HS384'
  | 'HS512'
  | 'RS256'
  | 'RS384'
  | 'RS512'
  | 'ES256'
  | 'ES384'
  | 'ES512'
  | 'PS256'
  | 'PS384'
  | 'PS512'

/**
 * Cookie options
 */
export interface CookieOptions {
  /** Cookie name */
  name?: string
  /** HTTP only */
  httpOnly?: boolean
  /** Secure */
  secure?: boolean
  /** Same site */
  sameSite?: 'strict' | 'lax' | 'none'
  /** Domain */
  domain?: string
  /** Path */
  path?: string
  /** Max age in seconds */
  maxAge?: number
}

/**
 * OAuth options
 */
export interface OAuthOptions {
  /** OAuth providers */
  providers?: OAuthProvider[]
  /** Callback URL path */
  callbackPath?: string
  /** State parameter options */
  state?: {
    /** Secret for signing state */
    secret?: string
    /** State expiry in seconds */
    expiresIn?: number
  }
  /** PKCE enabled */
  pkce?: boolean
  /** Scopes to request */
  defaultScopes?: string[]
}

/**
 * OAuth provider configuration
 */
export interface OAuthProvider {
  /** Provider type */
  type: OAuthProviderType
  /** Client ID (env var name) */
  clientId: string
  /** Client secret (env var name) */
  clientSecret: string
  /** Custom authorization URL */
  authorizationUrl?: string
  /** Custom token URL */
  tokenUrl?: string
  /** Custom user info URL */
  userInfoUrl?: string
  /** Scopes to request */
  scopes?: string[]
  /** Custom parameters */
  params?: Record<string, string>
}

/**
 * OAuth provider types
 */
export type OAuthProviderType =
  | 'google'
  | 'github'
  | 'discord'
  | 'twitter'
  | 'facebook'
  | 'microsoft'
  | 'apple'
  | 'linkedin'
  | 'slack'
  | 'spotify'
  | 'twitch'
  | 'custom'

/**
 * Session auth options
 */
export interface SessionOptions {
  /** Session store */
  store?: SessionStore
  /** Session name */
  name?: string
  /** Session secret */
  secret?: string
  /** Session expiry in seconds */
  maxAge?: number
  /** Rolling sessions */
  rolling?: boolean
  /** Regenerate on login */
  regenerate?: boolean
  /** Cookie options */
  cookie?: CookieOptions
  /** Redis options (for redis store) */
  redis?: RedisOptions
}

/**
 * Session store types
 */
export type SessionStore = 'memory' | 'redis' | 'database'

/**
 * Redis connection options
 */
export interface RedisOptions {
  /** Redis URL */
  url?: string
  /** Redis host */
  host?: string
  /** Redis port */
  port?: number
  /** Redis password */
  password?: string
  /** Redis database number */
  db?: number
  /** Key prefix */
  prefix?: string
  /** TLS enabled */
  tls?: boolean
}

/**
 * API key auth options
 */
export interface ApiKeyOptions {
  /** Header name for API key */
  headerName?: string
  /** Query param name for API key */
  queryParamName?: string
  /** API key prefix (e.g., "Bearer ") */
  prefix?: string
  /** API key length */
  keyLength?: number
  /** Hash algorithm for storing keys */
  hashAlgorithm?: 'sha256' | 'sha512' | 'argon2'
  /** Enable rate limiting per key */
  rateLimit?: boolean
  /** Enable scopes/permissions */
  scopes?: boolean
  /** Key rotation */
  rotation?: {
    enabled?: boolean
    gracePeriod?: number // seconds
  }
}

/**
 * Magic link auth options
 */
export interface MagicLinkOptions {
  /** Token expiry in seconds */
  tokenExpiry?: number
  /** Token length */
  tokenLength?: number
  /** Email provider */
  emailProvider?: EmailProvider
  /** Email template */
  emailTemplate?: {
    subject?: string
    from?: string
    replyTo?: string
  }
  /** Callback URL */
  callbackUrl?: string
  /** Rate limit (requests per minute) */
  rateLimit?: number
}

/**
 * Email provider types
 */
export type EmailProvider = 'sendgrid' | 'ses' | 'postmark' | 'resend' | 'smtp' | 'custom'

/**
 * Passkey/WebAuthn options
 */
export interface PasskeyOptions {
  /** Relying party name */
  rpName?: string
  /** Relying party ID (domain) */
  rpId?: string
  /** Allowed origins */
  origins?: string[]
  /** Attestation type */
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise'
  /** User verification */
  userVerification?: 'required' | 'preferred' | 'discouraged'
  /** Authenticator attachment */
  authenticatorAttachment?: 'platform' | 'cross-platform'
  /** Resident key */
  residentKey?: 'required' | 'preferred' | 'discouraged'
  /** Challenge timeout in ms */
  challengeTimeout?: number
}

/**
 * Token storage options
 */
export interface TokenStorageOptions {
  /** Storage type */
  type?: 'database' | 'redis' | 'memory'
  /** Table/key prefix */
  prefix?: string
  /** Redis options (for redis type) */
  redis?: RedisOptions
}

/**
 * Auth factory function type
 */
export type AuthFactory<T extends AuthOptions = AuthOptions> = (options?: Partial<T>) => AuthPlugin

/**
 * Create a base auth plugin
 */
export function createAuthPlugin(config: {
  name: string
  version: string
  strategy: AuthStrategy
  generate: AuthPlugin['generate']
  getMiddleware: AuthPlugin['getMiddleware']
  getDependencies: AuthPlugin['getDependencies']
  getPeerDependencies?: AuthPlugin['getPeerDependencies']
  generateRoutes?: AuthPlugin['generateRoutes']
  priority?: number
}): AuthPlugin {
  return {
    name: config.name,
    version: config.version,
    strategy: config.strategy,
    priority: config.priority ?? 0,
    generate: config.generate,
    getMiddleware: config.getMiddleware,
    getDependencies: config.getDependencies,
    getPeerDependencies: config.getPeerDependencies,
    generateRoutes: config.generateRoutes,
  }
}
