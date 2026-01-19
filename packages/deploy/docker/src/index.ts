/**
 * @opengenerator/deploy-docker
 * Docker deployment plugin for OpenGenerator.
 */

import type { DeployPlugin, DeployOptions, GeneratedCode, GeneratedFile, Dependency } from '@opengenerator/core'

export interface DockerOptions {
  nodeVersion?: string
  port?: number
  includeCompose?: boolean
  includeNginx?: boolean
  multistage?: boolean
  alpine?: boolean
}

const DEFAULT_OPTIONS: DockerOptions = {
  nodeVersion: '20',
  port: 3000,
  includeCompose: true,
  includeNginx: false,
  multistage: true,
  alpine: true,
}

function generateDockerfile(options: DockerOptions): string {
  const base = options.alpine ? `node:${options.nodeVersion}-alpine` : `node:${options.nodeVersion}`

  if (options.multistage) {
    return `# Build stage
FROM ${base} AS builder
WORKDIR /app
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production stage
FROM ${base} AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod
COPY --from=builder /app/dist ./dist
EXPOSE ${options.port}
USER node
CMD ["node", "dist/index.js"]
`
  }

  return `FROM ${base}
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE ${options.port}
USER node
CMD ["node", "dist/index.js"]
`
}

function generateDockerCompose(options: DockerOptions): string {
  return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "${options.port}:${options.port}"
    environment:
      - NODE_ENV=production
      - PORT=${options.port}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${options.port}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
`
}

function generateDockerIgnore(): string {
  return `node_modules
npm-debug.log
.git
.gitignore
.env*
!.env.example
dist
coverage
.nyc_output
*.md
.vscode
.idea
`
}

export function createDockerDeploy(options: DockerOptions = {}): DeployPlugin {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  return {
    name: '@opengenerator/deploy-docker',
    version: '1.0.0',
    target: 'docker',

    async generate(_code: GeneratedCode, options?: DeployOptions): Promise<GeneratedCode> {
      const opts = { ...mergedOptions, ...options } as DockerOptions
      const files: GeneratedFile[] = []

      files.push({ path: 'Dockerfile', content: generateDockerfile(opts), type: 'config' })
      files.push({ path: '.dockerignore', content: generateDockerIgnore(), type: 'config' })

      if (opts.includeCompose) {
        files.push({ path: 'docker-compose.yml', content: generateDockerCompose(opts), type: 'config' })
      }

      return { files, dependencies: [], metadata: { deploy: '@opengenerator/deploy-docker', options: opts } }
    },

    getDependencies(): Dependency[] {
      return []
    },
  }
}

export const dockerDeploy = createDockerDeploy()
export default dockerDeploy
