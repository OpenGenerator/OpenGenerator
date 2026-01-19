import type { Dependency, GeneratedCode, GeneratorOptions } from './generator'

/**
 * Deploy plugin interface
 * Deploy plugins generate deployment configurations
 */
export interface DeployPlugin {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Deployment target */
  target: DeployTarget
  /** Plugin priority (higher runs first) */
  priority?: number

  /**
   * Generate deployment configuration
   * @param code - Generated code from generators/adapters
   * @param options - Deploy options
   */
  generate(code: GeneratedCode, options: DeployOptions): Promise<GeneratedCode>

  /**
   * Get required dependencies
   */
  getDependencies(): Dependency[]

  /**
   * Validate deployment configuration
   */
  validate?(options: DeployOptions): DeployValidationResult
}

/**
 * Supported deployment targets
 */
export type DeployTarget = 'docker' | 'vercel' | 'railway' | 'fly' | 'lambda' | 'kubernetes'

/**
 * Deploy plugin options
 */
export interface DeployOptions extends GeneratorOptions {
  /** Deployment targets */
  targets?: DeployTarget[]
  /** Environment variables */
  env?: Record<string, string>
  /** Environment variable file */
  envFile?: string
  /** Docker options */
  docker?: DockerOptions
  /** Vercel options */
  vercel?: VercelOptions
  /** Railway options */
  railway?: RailwayOptions
  /** Fly.io options */
  fly?: FlyOptions
  /** AWS Lambda options */
  lambda?: LambdaOptions
  /** Kubernetes options */
  kubernetes?: KubernetesOptions
}

/**
 * Docker deployment options
 */
export interface DockerOptions {
  /** Base image */
  baseImage?: string
  /** Node.js version */
  nodeVersion?: string
  /** Expose port */
  port?: number
  /** Multi-stage build */
  multiStage?: boolean
  /** Generate docker-compose */
  compose?: boolean
  /** Docker Compose options */
  composeOptions?: DockerComposeOptions
  /** Health check */
  healthCheck?: HealthCheckOptions
  /** Labels */
  labels?: Record<string, string>
  /** Build args */
  buildArgs?: Record<string, string>
  /** Volumes */
  volumes?: string[]
}

/**
 * Docker Compose options
 */
export interface DockerComposeOptions {
  /** Version */
  version?: string
  /** Service name */
  serviceName?: string
  /** Include database service */
  database?: boolean
  /** Database type */
  databaseType?: 'postgres' | 'mysql' | 'mongodb' | 'redis'
  /** Include Redis */
  redis?: boolean
  /** Networks */
  networks?: string[]
  /** Environment file */
  envFile?: string
}

/**
 * Health check options
 */
export interface HealthCheckOptions {
  /** Health check path */
  path?: string
  /** Interval in seconds */
  interval?: number
  /** Timeout in seconds */
  timeout?: number
  /** Start period in seconds */
  startPeriod?: number
  /** Retries */
  retries?: number
}

/**
 * Vercel deployment options
 */
export interface VercelOptions {
  /** Project name */
  projectName?: string
  /** Runtime */
  runtime?: 'nodejs18.x' | 'nodejs20.x' | 'edge'
  /** Regions */
  regions?: string[]
  /** Memory size in MB */
  memory?: number
  /** Max duration in seconds */
  maxDuration?: number
  /** Environment variables */
  env?: Record<string, string>
  /** Build command */
  buildCommand?: string
  /** Output directory */
  outputDirectory?: string
  /** Rewrites */
  rewrites?: Array<{ source: string; destination: string }>
  /** Headers */
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>
  /** Cron jobs */
  crons?: Array<{ path: string; schedule: string }>
}

/**
 * Railway deployment options
 */
export interface RailwayOptions {
  /** Service name */
  serviceName?: string
  /** Build command */
  buildCommand?: string
  /** Start command */
  startCommand?: string
  /** Health check path */
  healthcheckPath?: string
  /** Health check timeout */
  healthcheckTimeout?: number
  /** Environment variables */
  env?: Record<string, string>
  /** Restart policy */
  restartPolicy?: 'always' | 'on-failure' | 'never'
  /** Number of replicas */
  replicas?: number
}

/**
 * Fly.io deployment options
 */
export interface FlyOptions {
  /** App name */
  appName?: string
  /** Primary region */
  primaryRegion?: string
  /** Regions */
  regions?: string[]
  /** VM size */
  vmSize?: 'shared-cpu-1x' | 'shared-cpu-2x' | 'shared-cpu-4x' | 'dedicated-cpu-1x' | 'dedicated-cpu-2x'
  /** Memory in MB */
  memory?: number
  /** Auto-scaling */
  autoScaling?: {
    minCount?: number
    maxCount?: number
    softLimit?: number
    hardLimit?: number
  }
  /** Health checks */
  healthChecks?: {
    httpChecks?: Array<{
      port: number
      path: string
      interval?: string
      timeout?: string
    }>
  }
  /** Mounts */
  mounts?: Array<{
    source: string
    destination: string
  }>
  /** Environment variables */
  env?: Record<string, string>
  /** Secrets */
  secrets?: string[]
}

/**
 * AWS Lambda deployment options
 */
export interface LambdaOptions {
  /** Function name */
  functionName?: string
  /** Runtime */
  runtime?: 'nodejs18.x' | 'nodejs20.x'
  /** Handler */
  handler?: string
  /** Memory size in MB */
  memorySize?: number
  /** Timeout in seconds */
  timeout?: number
  /** Architecture */
  architecture?: 'x86_64' | 'arm64'
  /** Environment variables */
  env?: Record<string, string>
  /** VPC configuration */
  vpc?: {
    subnetIds?: string[]
    securityGroupIds?: string[]
  }
  /** Layers */
  layers?: string[]
  /** API Gateway */
  apiGateway?: {
    type?: 'REST' | 'HTTP'
    stage?: string
    cors?: boolean
  }
  /** Generate SAM template */
  sam?: boolean
  /** Generate CDK construct */
  cdk?: boolean
}

/**
 * Kubernetes deployment options
 */
export interface KubernetesOptions {
  /** Namespace */
  namespace?: string
  /** Deployment name */
  deploymentName?: string
  /** Number of replicas */
  replicas?: number
  /** Container port */
  containerPort?: number
  /** Service type */
  serviceType?: 'ClusterIP' | 'NodePort' | 'LoadBalancer'
  /** Service port */
  servicePort?: number
  /** Image */
  image?: string
  /** Image pull policy */
  imagePullPolicy?: 'Always' | 'IfNotPresent' | 'Never'
  /** Resources */
  resources?: {
    requests?: {
      cpu?: string
      memory?: string
    }
    limits?: {
      cpu?: string
      memory?: string
    }
  }
  /** Liveness probe */
  livenessProbe?: ProbeConfig
  /** Readiness probe */
  readinessProbe?: ProbeConfig
  /** Environment variables */
  env?: Record<string, string>
  /** Config maps */
  configMaps?: string[]
  /** Secrets */
  secrets?: string[]
  /** Ingress */
  ingress?: IngressConfig
  /** Generate Helm chart */
  helm?: boolean
  /** Helm options */
  helmOptions?: HelmOptions
  /** Horizontal Pod Autoscaler */
  hpa?: {
    minReplicas?: number
    maxReplicas?: number
    targetCPUUtilization?: number
  }
}

/**
 * Kubernetes probe configuration
 */
export interface ProbeConfig {
  /** HTTP get path */
  httpGet?: {
    path: string
    port: number
  }
  /** Initial delay in seconds */
  initialDelaySeconds?: number
  /** Period in seconds */
  periodSeconds?: number
  /** Timeout in seconds */
  timeoutSeconds?: number
  /** Failure threshold */
  failureThreshold?: number
  /** Success threshold */
  successThreshold?: number
}

/**
 * Kubernetes Ingress configuration
 */
export interface IngressConfig {
  /** Enable ingress */
  enabled?: boolean
  /** Ingress class */
  className?: string
  /** Annotations */
  annotations?: Record<string, string>
  /** Hosts */
  hosts?: Array<{
    host: string
    paths: Array<{
      path: string
      pathType: 'Prefix' | 'Exact' | 'ImplementationSpecific'
    }>
  }>
  /** TLS */
  tls?: Array<{
    secretName: string
    hosts: string[]
  }>
}

/**
 * Helm chart options
 */
export interface HelmOptions {
  /** Chart name */
  chartName?: string
  /** Chart version */
  chartVersion?: string
  /** App version */
  appVersion?: string
  /** Chart description */
  description?: string
  /** Values file */
  valuesFile?: boolean
  /** Include tests */
  tests?: boolean
  /** Include notes */
  notes?: boolean
}

/**
 * Deploy validation result
 */
export interface DeployValidationResult {
  /** Is valid */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
}

/**
 * Deploy factory function type
 */
export type DeployFactory<T extends DeployOptions = DeployOptions> = (
  options?: Partial<T>
) => DeployPlugin

/**
 * Create a base deploy plugin
 */
export function createDeployPlugin(config: {
  name: string
  version: string
  target: DeployTarget
  generate: DeployPlugin['generate']
  getDependencies: DeployPlugin['getDependencies']
  validate?: DeployPlugin['validate']
  priority?: number
}): DeployPlugin {
  return {
    name: config.name,
    version: config.version,
    target: config.target,
    priority: config.priority ?? 0,
    generate: config.generate,
    getDependencies: config.getDependencies,
    validate: config.validate,
  }
}
