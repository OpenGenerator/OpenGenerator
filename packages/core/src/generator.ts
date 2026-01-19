import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

import type {
  ParserPlugin,
  GeneratorPlugin,
  AdapterPlugin,
  AuthPlugin,
  DatabasePlugin,
  DeployPlugin,
  SchemaIR,
  GeneratedCode,
  GeneratorOptions,
  Dependency,
} from './types'
import { mergeGeneratedCode, mergeDependencies } from './types'
import { writeGeneratedCode } from './emitter'
import { Watcher } from './watcher'

/**
 * Options for the generate method
 */
export interface GenerateOptions extends GeneratorOptions {
  /** Schema file path or inline content */
  schema: string
  /** Output directory */
  output: string
  /** Write files to disk */
  write?: boolean
  /** Dry run (don't write files) */
  dryRun?: boolean
}

/**
 * OpenGenerator - Main generator class
 *
 * @example
 * ```typescript
 * const generator = new OpenGenerator()
 *   .parser(prismaParser())
 *   .generator(restGenerator())
 *   .adapter(fastifyAdapter())
 *   .auth(jwtAuth())
 *   .database(prismaDb())
 *   .deploy(dockerDeploy())
 *
 * await generator.generate({
 *   schema: './prisma/schema.prisma',
 *   output: './generated',
 * })
 * ```
 */
export class OpenGenerator {
  private parserPlugins: Map<string, ParserPlugin> = new Map()
  private generatorPlugins: Map<string, GeneratorPlugin> = new Map()
  private adapterPlugins: Map<string, AdapterPlugin> = new Map()
  private authPlugins: Map<string, AuthPlugin> = new Map()
  private databasePlugins: Map<string, DatabasePlugin> = new Map()
  private deployPlugins: Map<string, DeployPlugin> = new Map()

  private selectedParser?: ParserPlugin
  private selectedGenerators: GeneratorPlugin[] = []
  private selectedAdapter?: AdapterPlugin
  private selectedAuth: AuthPlugin[] = []
  private selectedDatabase?: DatabasePlugin
  private selectedDeploy: DeployPlugin[] = []

  /**
   * Register and select a parser plugin
   * @param plugin - Parser plugin instance
   */
  parser(plugin: ParserPlugin): this {
    this.parserPlugins.set(plugin.name, plugin)
    this.selectedParser = plugin
    return this
  }

  /**
   * Register and select a generator plugin
   * @param plugin - Generator plugin instance
   */
  generator(plugin: GeneratorPlugin): this {
    this.generatorPlugins.set(plugin.name, plugin)
    this.selectedGenerators.push(plugin)
    // Sort by priority (higher first)
    this.selectedGenerators.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return this
  }

  /**
   * Register and select an adapter plugin
   * @param plugin - Adapter plugin instance
   */
  adapter(plugin: AdapterPlugin): this {
    this.adapterPlugins.set(plugin.name, plugin)
    this.selectedAdapter = plugin
    return this
  }

  /**
   * Register and select an auth plugin
   * @param plugin - Auth plugin instance
   */
  auth(plugin: AuthPlugin): this {
    this.authPlugins.set(plugin.name, plugin)
    this.selectedAuth.push(plugin)
    // Sort by priority (higher first)
    this.selectedAuth.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return this
  }

  /**
   * Register and select a database plugin
   * @param plugin - Database plugin instance
   */
  database(plugin: DatabasePlugin): this {
    this.databasePlugins.set(plugin.name, plugin)
    this.selectedDatabase = plugin
    return this
  }

  /**
   * Register and select a deploy plugin
   * @param plugin - Deploy plugin instance
   */
  deploy(plugin: DeployPlugin): this {
    this.deployPlugins.set(plugin.name, plugin)
    this.selectedDeploy.push(plugin)
    // Sort by priority (higher first)
    this.selectedDeploy.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    return this
  }

  /**
   * Get the selected parser
   */
  getParser(): ParserPlugin | undefined {
    return this.selectedParser
  }

  /**
   * Get all selected generators
   */
  getGenerators(): GeneratorPlugin[] {
    return [...this.selectedGenerators]
  }

  /**
   * Get the selected adapter
   */
  getAdapter(): AdapterPlugin | undefined {
    return this.selectedAdapter
  }

  /**
   * Get all selected auth plugins
   */
  getAuth(): AuthPlugin[] {
    return [...this.selectedAuth]
  }

  /**
   * Get the selected database plugin
   */
  getDatabase(): DatabasePlugin | undefined {
    return this.selectedDatabase
  }

  /**
   * Get all selected deploy plugins
   */
  getDeploy(): DeployPlugin[] {
    return [...this.selectedDeploy]
  }

  /**
   * Parse a schema file to IR
   * @param input - Schema file path or inline content
   */
  async parse(input: string): Promise<SchemaIR> {
    if (!this.selectedParser) {
      throw new Error('No parser selected. Call .parser() first.')
    }

    const content = await this.readInput(input)
    return this.selectedParser.parse(content, {
      filePath: existsSync(input) ? resolve(input) : undefined,
    })
  }

  /**
   * Generate code from schema
   * @param options - Generation options
   */
  async generate(options: GenerateOptions): Promise<GeneratedCode> {
    // Parse schema
    const schema = await this.parse(options.schema)

    let code: GeneratedCode = { files: [], dependencies: [] }

    // 1. Run all generators
    for (const gen of this.selectedGenerators) {
      const generated = await gen.generate(schema, options)
      code = mergeGeneratedCode(code, generated)
    }

    // 2. Apply adapter
    if (this.selectedAdapter) {
      code = await this.selectedAdapter.adapt(code, options)
    }

    // 3. Add auth
    for (const auth of this.selectedAuth) {
      const authCode = await auth.generate(schema, options)
      code = mergeGeneratedCode(code, authCode)
    }

    // 4. Add database layer
    if (this.selectedDatabase) {
      const dbCode = await this.selectedDatabase.generate(schema, options)
      code = mergeGeneratedCode(code, dbCode)
    }

    // 5. Add deployment configs
    for (const dep of this.selectedDeploy) {
      const deployCode = await dep.generate(code, options)
      code = mergeGeneratedCode(code, deployCode)
    }

    // 6. Collect all dependencies
    code.dependencies = this.collectDependencies(code.dependencies)

    // 7. Write to disk (unless dry run)
    if (options.output && options.write !== false && !options.dryRun) {
      await writeGeneratedCode(code, options.output)
    }

    return code
  }

  /**
   * Watch for schema changes and regenerate
   * @param options - Generation options
   */
  watch(options: GenerateOptions): Watcher {
    return new Watcher(this, options)
  }

  /**
   * Validate the current configuration
   */
  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = []
    const warnings: string[] = []

    if (!this.selectedParser) {
      errors.push('No parser selected')
    }

    if (this.selectedGenerators.length === 0) {
      errors.push('No generators selected')
    }

    if (!this.selectedAdapter) {
      warnings.push('No adapter selected - generated code may not be framework-specific')
    }

    if (this.selectedAuth.length === 0) {
      warnings.push('No auth plugins selected - API will be unauthenticated')
    }

    if (!this.selectedDatabase) {
      warnings.push('No database plugin selected - no database layer will be generated')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Reset all selections
   */
  reset(): this {
    this.selectedParser = undefined
    this.selectedGenerators = []
    this.selectedAdapter = undefined
    this.selectedAuth = []
    this.selectedDatabase = undefined
    this.selectedDeploy = []
    return this
  }

  /**
   * Clone the generator with current configuration
   */
  clone(): OpenGenerator {
    const cloned = new OpenGenerator()
    cloned.parserPlugins = new Map(this.parserPlugins)
    cloned.generatorPlugins = new Map(this.generatorPlugins)
    cloned.adapterPlugins = new Map(this.adapterPlugins)
    cloned.authPlugins = new Map(this.authPlugins)
    cloned.databasePlugins = new Map(this.databasePlugins)
    cloned.deployPlugins = new Map(this.deployPlugins)
    cloned.selectedParser = this.selectedParser
    cloned.selectedGenerators = [...this.selectedGenerators]
    cloned.selectedAdapter = this.selectedAdapter
    cloned.selectedAuth = [...this.selectedAuth]
    cloned.selectedDatabase = this.selectedDatabase
    cloned.selectedDeploy = [...this.selectedDeploy]
    return cloned
  }

  /**
   * Read input from file path or return inline content
   */
  private async readInput(input: string): Promise<string> {
    // Check if input is a file path
    if (existsSync(input)) {
      return readFile(input, 'utf-8')
    }

    // Check if input looks like a URL
    if (input.startsWith('http://') || input.startsWith('https://')) {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to fetch schema from ${input}: ${response.statusText}`)
      }
      return response.text()
    }

    // Assume inline content
    return input
  }

  /**
   * Collect all dependencies from plugins
   */
  private collectDependencies(existing: Dependency[]): Dependency[] {
    const deps: Dependency[] = [...existing]

    // Add adapter dependencies
    if (this.selectedAdapter) {
      deps.push(...this.selectedAdapter.getDependencies())
      deps.push(...(this.selectedAdapter.getPeerDependencies?.() ?? []))
    }

    // Add generator dependencies
    for (const gen of this.selectedGenerators) {
      deps.push(...gen.getDependencies())
      deps.push(...(gen.getPeerDependencies?.() ?? []))
    }

    // Add auth dependencies
    for (const auth of this.selectedAuth) {
      deps.push(...auth.getDependencies())
      deps.push(...(auth.getPeerDependencies?.() ?? []))
    }

    // Add database dependencies
    if (this.selectedDatabase) {
      deps.push(...this.selectedDatabase.getDependencies())
      deps.push(...(this.selectedDatabase.getPeerDependencies?.() ?? []))
    }

    // Add deploy dependencies
    for (const dep of this.selectedDeploy) {
      deps.push(...dep.getDependencies())
    }

    return mergeDependencies(deps, [])
  }
}

/**
 * Factory function for creating generator instances
 */
export function createGenerator(): OpenGenerator {
  return new OpenGenerator()
}
