/**
 * @opengenerator/deploy-railway
 * Railway deployment plugin for OpenGenerator.
 */

import type { DeployPlugin, DeployOptions, GeneratedCode, GeneratedFile, Dependency } from '@opengenerator/core'

export interface RailwayOptions { includeDatabase?: boolean; region?: string }
const DEFAULT_OPTIONS: RailwayOptions = { includeDatabase: true, region: 'us-west1' }

function generateRailwayConfig(_options: RailwayOptions): string {
  return `[build]
builder = "nixpacks"

[deploy]
startCommand = "pnpm start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
`
}

function generateNixpacksConfig(): string {
  return `providers = ["node"]

[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["corepack enable", "pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm build"]

[start]
cmd = "pnpm start"
`
}

export function createRailwayDeploy(options: RailwayOptions = {}): DeployPlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/deploy-railway',
    version: '1.0.0',
    target: 'railway',

    async generate(_code: GeneratedCode, options?: DeployOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ...options } as RailwayOptions
      const files: GeneratedFile[] = [
        { path: 'railway.toml', content: generateRailwayConfig(opts), type: 'config' },
        { path: 'nixpacks.toml', content: generateNixpacksConfig(), type: 'config' },
      ]

      return { files, dependencies: [], metadata: { deploy: '@opengenerator/deploy-railway', options: opts } }
    },

    getDependencies(): Dependency[] {
      return []
    },
  }
}

export const railwayDeploy = createRailwayDeploy()
export default railwayDeploy
