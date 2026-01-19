/**
 * @opengenerator/deploy-fly
 * Fly.io deployment plugin for OpenGenerator.
 */

import type { DeployPlugin, DeployOptions, GeneratedCode, GeneratedFile, Dependency } from '@opengenerator/core'

export interface FlyOptions { appName?: string; region?: string; memory?: number; cpuKind?: 'shared' | 'performance' }
const DEFAULT_OPTIONS: FlyOptions = { region: 'iad', memory: 256, cpuKind: 'shared' }

function generateFlyConfig(options: FlyOptions): string {
  return `app = "${options.appName || 'my-app'}"
primary_region = "${options.region}"

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "${options.cpuKind}"
  cpus = 1
  memory_mb = ${options.memory}

[checks]
  [checks.health]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    path = "/health"
    port = 3000
    timeout = "5s"
    type = "http"
`
}

export function createFlyDeploy(options: FlyOptions = {}): DeployPlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/deploy-fly',
    version: '1.0.0',
    target: 'fly',

    async generate(_code: GeneratedCode, options?: DeployOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ...options } as FlyOptions
      const files: GeneratedFile[] = [
        { path: 'fly.toml', content: generateFlyConfig(opts), type: 'config' },
      ]

      return { files, dependencies: [], metadata: { deploy: '@opengenerator/deploy-fly', options: opts } }
    },

    getDependencies(): Dependency[] {
      return []
    },
  }
}

export const flyDeploy = createFlyDeploy()
export default flyDeploy
