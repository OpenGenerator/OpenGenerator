/**
 * @opengenerator/deploy-vercel
 * Vercel deployment plugin for OpenGenerator.
 */

import type { DeployPlugin, DeployOptions, GeneratedCode, GeneratedFile, Dependency } from '@opengenerator/core'

export interface VercelOptions {
  framework?: 'hono' | 'express' | 'nextjs'
  region?: string
  memory?: number
  maxDuration?: number
}

const DEFAULT_OPTIONS: VercelOptions = { framework: 'hono', region: 'iad1', memory: 1024, maxDuration: 10 }

function generateVercelConfig(options: VercelOptions): string {
  return JSON.stringify({
    version: 2,
    builds: [{ src: 'api/index.ts', use: '@vercel/node' }],
    routes: [{ src: '/api/(.*)', dest: '/api/index.ts' }, { src: '/(.*)', dest: '/api/index.ts' }],
    functions: { 'api/**/*.ts': { memory: options.memory, maxDuration: options.maxDuration } },
    regions: [options.region],
  }, null, 2)
}

function generateApiHandler(options: VercelOptions): string {
  if (options.framework === 'hono') {
    return `import { Hono } from 'hono'
import { handle } from 'hono/vercel'

const app = new Hono().basePath('/api')

app.get('/health', (c) => c.json({ status: 'ok' }))

export default handle(app)
`
  }
  return `import { createApp } from '../src/app'

const app = createApp()
export default app
`
}

export function createVercelDeploy(options: VercelOptions = {}): DeployPlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/deploy-vercel',
    version: '1.0.0',
    target: 'vercel',

    async generate(_code: GeneratedCode, options?: DeployOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ...options } as VercelOptions
      const files: GeneratedFile[] = [
        { path: 'vercel.json', content: generateVercelConfig(opts), type: 'config' },
        { path: 'api/index.ts', content: generateApiHandler(opts), type: 'source' },
      ]

      return { files, dependencies: [], metadata: { deploy: '@opengenerator/deploy-vercel', options: opts } }
    },

    getDependencies(): Dependency[] {
      return []
    },
  }
}

export const vercelDeploy = createVercelDeploy()
export default vercelDeploy
