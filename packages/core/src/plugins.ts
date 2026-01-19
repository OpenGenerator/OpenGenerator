import type {
  ParserPlugin,
  GeneratorPlugin,
  AdapterPlugin,
  AuthPlugin,
  DatabasePlugin,
  DeployPlugin,
} from './types'

/**
 * Plugin types
 */
export type PluginType = 'parser' | 'generator' | 'adapter' | 'auth' | 'database' | 'deploy'

/**
 * Any plugin type
 */
export type AnyPlugin =
  | ParserPlugin
  | GeneratorPlugin
  | AdapterPlugin
  | AuthPlugin
  | DatabasePlugin
  | DeployPlugin

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin name */
  name: string
  /** Plugin version */
  version: string
  /** Plugin type */
  type: PluginType
  /** Plugin description */
  description?: string
  /** Plugin author */
  author?: string
  /** Plugin homepage */
  homepage?: string
  /** Plugin repository */
  repository?: string
  /** Plugin license */
  license?: string
  /** Plugin keywords */
  keywords?: string[]
}

/**
 * Plugin registration
 */
export interface PluginRegistration {
  /** Plugin metadata */
  metadata: PluginMetadata
  /** Plugin instance */
  plugin: AnyPlugin
  /** Registration timestamp */
  registeredAt: number
}

/**
 * Plugin registry for managing plugins
 */
export class PluginRegistry {
  private plugins: Map<string, PluginRegistration> = new Map()

  /**
   * Register a plugin
   */
  register(plugin: AnyPlugin, type: PluginType, metadata?: Partial<PluginMetadata>): void {
    const key = this.getKey(plugin.name, type)

    if (this.plugins.has(key)) {
      throw new Error(`Plugin '${plugin.name}' of type '${type}' is already registered`)
    }

    this.plugins.set(key, {
      metadata: {
        name: plugin.name,
        version: plugin.version,
        type,
        ...metadata,
      },
      plugin,
      registeredAt: Date.now(),
    })
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string, type: PluginType): boolean {
    return this.plugins.delete(this.getKey(name, type))
  }

  /**
   * Get a plugin by name and type
   */
  get<T extends AnyPlugin>(name: string, type: PluginType): T | undefined {
    const registration = this.plugins.get(this.getKey(name, type))
    return registration?.plugin as T | undefined
  }

  /**
   * Check if a plugin is registered
   */
  has(name: string, type: PluginType): boolean {
    return this.plugins.has(this.getKey(name, type))
  }

  /**
   * Get all plugins of a type
   */
  getByType<T extends AnyPlugin>(type: PluginType): T[] {
    const result: T[] = []
    for (const [key, registration] of this.plugins) {
      if (key.startsWith(`${type}:`)) {
        result.push(registration.plugin as T)
      }
    }
    return result
  }

  /**
   * Get all registered plugins
   */
  getAll(): PluginRegistration[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Get plugin metadata
   */
  getMetadata(name: string, type: PluginType): PluginMetadata | undefined {
    return this.plugins.get(this.getKey(name, type))?.metadata
  }

  /**
   * List all plugin names by type
   */
  list(type?: PluginType): string[] {
    const names: string[] = []
    for (const [key] of this.plugins) {
      if (!type || key.startsWith(`${type}:`)) {
        const [, name] = key.split(':')
        if (name) {
          names.push(name)
        }
      }
    }
    return names
  }

  /**
   * Clear all plugins
   */
  clear(): void {
    this.plugins.clear()
  }

  /**
   * Get plugin count
   */
  get size(): number {
    return this.plugins.size
  }

  /**
   * Create a unique key for a plugin
   */
  private getKey(name: string, type: PluginType): string {
    return `${type}:${name}`
  }
}

/**
 * Global plugin registry instance
 */
export const globalRegistry = new PluginRegistry()

/**
 * Plugin loader for dynamic plugin loading
 */
export class PluginLoader {
  private loadedModules: Map<string, unknown> = new Map()

  /**
   * Load a plugin from a package name
   */
  async load(packageName: string): Promise<AnyPlugin> {
    if (this.loadedModules.has(packageName)) {
      return this.loadedModules.get(packageName) as AnyPlugin
    }

    try {
      const module = await import(packageName)
      const plugin = module.default ?? module

      // Validate it's a plugin
      if (!this.isPlugin(plugin)) {
        throw new Error(`Module '${packageName}' does not export a valid plugin`)
      }

      this.loadedModules.set(packageName, plugin)
      return plugin
    } catch (error) {
      throw new Error(`Failed to load plugin '${packageName}': ${error}`)
    }
  }

  /**
   * Load multiple plugins
   */
  async loadAll(packageNames: string[]): Promise<AnyPlugin[]> {
    return Promise.all(packageNames.map((name) => this.load(name)))
  }

  /**
   * Check if a value is a valid plugin
   */
  private isPlugin(value: unknown): value is AnyPlugin {
    return (
      typeof value === 'object' &&
      value !== null &&
      'name' in value &&
      'version' in value &&
      typeof (value as AnyPlugin).name === 'string' &&
      typeof (value as AnyPlugin).version === 'string'
    )
  }

  /**
   * Detect plugin type from the plugin object
   */
  detectType(plugin: AnyPlugin): PluginType {
    if ('extensions' in plugin && 'parse' in plugin) {
      return 'parser'
    }
    if ('style' in plugin && 'generate' in plugin) {
      return 'generator'
    }
    if ('framework' in plugin && 'adapt' in plugin) {
      return 'adapter'
    }
    if ('strategy' in plugin && 'getMiddleware' in plugin) {
      return 'auth'
    }
    if ('adapter' in plugin && 'generateMigrations' in plugin) {
      return 'database'
    }
    if ('target' in plugin) {
      return 'deploy'
    }
    throw new Error('Unable to detect plugin type')
  }
}

/**
 * Global plugin loader instance
 */
export const pluginLoader = new PluginLoader()

/**
 * Plugin discovery for auto-loading plugins from node_modules
 */
export async function discoverPlugins(options: {
  prefix?: string
  scope?: string
}): Promise<PluginMetadata[]> {
  const { prefix: _prefix = 'opengenerator-plugin-', scope: _scope = '@opengenerator' } = options

  // This would scan node_modules for matching packages
  // For now, return empty array as this requires file system scanning
  // that should be implemented based on the actual runtime environment

  return []
}

/**
 * Create a plugin factory
 */
export function createPluginFactory<T extends AnyPlugin, O = Record<string, unknown>>(
  creator: (options?: O) => T
): (options?: O) => T {
  return (options?: O) => creator(options)
}
