import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

import type { GeneratedCode, GeneratedFile, Dependency } from './types'

/**
 * Emitter options
 */
export interface EmitterOptions {
  /** Overwrite existing files */
  overwrite?: boolean
  /** Create directories as needed */
  createDirs?: boolean
  /** File encoding */
  encoding?: BufferEncoding
  /** Dry run (don't write files) */
  dryRun?: boolean
  /** Verbose logging */
  verbose?: boolean
  /** Before write hook */
  beforeWrite?: (file: GeneratedFile) => GeneratedFile | null
  /** After write hook */
  afterWrite?: (file: GeneratedFile, path: string) => void
}

/**
 * Emit result
 */
export interface EmitResult {
  /** Files written */
  written: string[]
  /** Files skipped */
  skipped: string[]
  /** Files failed */
  failed: Array<{ path: string; error: Error }>
  /** Total bytes written */
  totalBytes: number
}

/**
 * Write generated code to disk
 */
export async function writeGeneratedCode(
  code: GeneratedCode,
  outputDir: string,
  options: EmitterOptions = {}
): Promise<EmitResult> {
  const {
    overwrite = true,
    createDirs = true,
    encoding = 'utf-8',
    dryRun = false,
    verbose = false,
    beforeWrite,
    afterWrite,
  } = options

  const result: EmitResult = {
    written: [],
    skipped: [],
    failed: [],
    totalBytes: 0,
  }

  const resolvedOutput = resolve(outputDir)

  // Create output directory if needed
  if (createDirs && !dryRun && !existsSync(resolvedOutput)) {
    await mkdir(resolvedOutput, { recursive: true })
  }

  // Write each file
  for (const file of code.files) {
    const filePath = join(resolvedOutput, file.path)
    const fileDir = dirname(filePath)

    try {
      // Apply before write hook
      const processedFile = beforeWrite ? beforeWrite(file) : file
      if (!processedFile) {
        result.skipped.push(filePath)
        continue
      }

      // Check if file exists
      if (!overwrite && !processedFile.overwrite && existsSync(filePath)) {
        result.skipped.push(filePath)
        if (verbose) {
          console.log(`Skipped (exists): ${filePath}`)
        }
        continue
      }

      if (!dryRun) {
        // Create directory if needed
        if (createDirs && !existsSync(fileDir)) {
          await mkdir(fileDir, { recursive: true })
        }

        // Write file
        await writeFile(filePath, processedFile.content, {
          encoding: processedFile.encoding ?? encoding,
          mode: processedFile.mode,
        })

        // Apply after write hook
        afterWrite?.(processedFile, filePath)
      }

      result.written.push(filePath)
      result.totalBytes += Buffer.byteLength(processedFile.content, encoding)

      if (verbose) {
        console.log(`Written: ${filePath}`)
      }
    } catch (error) {
      result.failed.push({
        path: filePath,
        error: error instanceof Error ? error : new Error(String(error)),
      })

      if (verbose) {
        console.error(`Failed: ${filePath}`, error)
      }
    }
  }

  return result
}

/**
 * Generate package.json content
 */
export function generatePackageJson(
  name: string,
  dependencies: Dependency[],
  options: {
    version?: string
    description?: string
    author?: string
    license?: string
    main?: string
    types?: string
    scripts?: Record<string, string>
    keywords?: string[]
  } = {}
): string {
  const deps: Record<string, string> = {}
  const devDeps: Record<string, string> = {}
  const peerDeps: Record<string, string> = {}

  for (const dep of dependencies) {
    switch (dep.type ?? 'dependencies') {
      case 'dependencies':
        deps[dep.name] = dep.version
        break
      case 'devDependencies':
        devDeps[dep.name] = dep.version
        break
      case 'peerDependencies':
        peerDeps[dep.name] = dep.version
        break
    }
  }

  const pkg: Record<string, unknown> = {
    name,
    version: options.version ?? '1.0.0',
    description: options.description,
    author: options.author,
    license: options.license ?? 'MIT',
    type: 'module',
    main: options.main ?? './dist/index.js',
    types: options.types ?? './dist/index.d.ts',
  }

  if (options.scripts) {
    pkg.scripts = options.scripts
  }

  if (options.keywords?.length) {
    pkg.keywords = options.keywords
  }

  if (Object.keys(deps).length > 0) {
    pkg.dependencies = deps
  }

  if (Object.keys(devDeps).length > 0) {
    pkg.devDependencies = devDeps
  }

  if (Object.keys(peerDeps).length > 0) {
    pkg.peerDependencies = peerDeps
  }

  return JSON.stringify(pkg, null, 2)
}

/**
 * Generate tsconfig.json content
 */
export function generateTsConfig(options: {
  extends?: string
  compilerOptions?: Record<string, unknown>
  include?: string[]
  exclude?: string[]
} = {}): string {
  const config: Record<string, unknown> = {}

  if (options.extends) {
    config.extends = options.extends
  }

  config.compilerOptions = {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'bundler',
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    declaration: true,
    declarationMap: true,
    outDir: './dist',
    rootDir: './src',
    ...options.compilerOptions,
  }

  if (options.include) {
    config.include = options.include
  }

  if (options.exclude) {
    config.exclude = options.exclude
  }

  return JSON.stringify(config, null, 2)
}

/**
 * Generate .gitignore content
 */
export function generateGitignore(): string {
  return `# Dependencies
node_modules/

# Build output
dist/

# IDE
.idea/
.vscode/
*.swp

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Environment
.env
.env.local
.env.*.local

# Test coverage
coverage/

# Cache
.cache/
`
}

/**
 * Generate .env.example content
 */
export function generateEnvExample(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, description]) => `# ${description}\n${key}=`)
    .join('\n\n')
}

/**
 * Code emitter base class for generators
 */
export abstract class CodeEmitter {
  protected files: GeneratedFile[] = []

  /**
   * Add a file to emit
   */
  protected addFile(path: string, content: string, options?: Partial<GeneratedFile>): void {
    this.files.push({
      path,
      content,
      ...options,
    })
  }

  /**
   * Get all files
   */
  getFiles(): GeneratedFile[] {
    return [...this.files]
  }

  /**
   * Clear all files
   */
  clear(): void {
    this.files = []
  }

  /**
   * Abstract method to implement generation logic
   */
  abstract emit(): GeneratedFile[]
}
