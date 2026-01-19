/**
 * @opengenerator/core
 *
 * Core engine for OpenGenerator - Schema-to-API code generator
 *
 * @packageDocumentation
 */

// Main generator
export { OpenGenerator, createGenerator } from './generator'
export type { GenerateOptions } from './generator'

// Pipeline
export { Pipeline, createPipeline, schemaTransforms, codeTransforms } from './pipeline'
export type {
  PipelineStage,
  PipelineEvent,
  PipelineHook,
  SchemaTransform,
  CodeTransform,
  FileFilter,
  PipelineConfig,
  PipelineResult,
} from './pipeline'

// Template engine
export { TemplateEngine, createTemplateEngine, templateEngine } from './template'
export type { TemplateContext } from './template'

// Code emitter
export {
  writeGeneratedCode,
  generatePackageJson,
  generateTsConfig,
  generateGitignore,
  generateEnvExample,
  CodeEmitter,
} from './emitter'
export type { EmitterOptions, EmitResult } from './emitter'

// Plugin system
export {
  PluginRegistry,
  PluginLoader,
  globalRegistry,
  pluginLoader,
  discoverPlugins,
  createPluginFactory,
} from './plugins'
export type {
  PluginType,
  AnyPlugin,
  PluginMetadata,
  PluginRegistration,
} from './plugins'

// Configuration
export {
  loadConfig,
  validateConfig,
  defineConfig,
  mergeConfigs,
  getEnabledApiStyles,
  getEnabledAuthStrategies,
  getDeployTargets,
  configSchema,
} from './config'
export type { OpenGeneratorConfig, ConfigResult } from './config'

// Watcher
export { Watcher, createWatcher } from './watcher'
export type { WatcherEvent, WatcherEventHandler, WatcherOptions } from './watcher'

// All types
export * from './types'
