# @opengenerator/core

Core engine for OpenGenerator - Schema-to-API code generator.

## Installation

```bash
npm install @opengenerator/core
# or
pnpm add @opengenerator/core
# or
yarn add @opengenerator/core
```

## Usage

```typescript
import { OpenGenerator, createGenerator } from '@opengenerator/core'
import { prismaParser } from '@opengenerator/parser-prisma'
import { restGenerator } from '@opengenerator/gen-rest'
import { fastifyAdapter } from '@opengenerator/adapter-fastify'

// Create generator instance
const generator = createGenerator()
  .parser(prismaParser())
  .generator(restGenerator())
  .adapter(fastifyAdapter())

// Generate code
const result = await generator.generate({
  schema: './prisma/schema.prisma',
  output: './generated',
})

console.log(`Generated ${result.files.length} files`)
```

## API Reference

### OpenGenerator

The main generator class that orchestrates the code generation pipeline.

```typescript
const generator = new OpenGenerator()
  .parser(parserPlugin)      // Set schema parser
  .generator(genPlugin)       // Add API generator
  .adapter(adapterPlugin)     // Set framework adapter
  .auth(authPlugin)          // Add auth plugin
  .database(dbPlugin)        // Set database plugin
  .deploy(deployPlugin)      // Add deploy plugin

// Parse schema only
const schema = await generator.parse('./schema.prisma')

// Generate code
const code = await generator.generate({
  schema: './schema.prisma',
  output: './generated',
})

// Watch for changes
const watcher = generator.watch(options)
await watcher.start()
```

### Pipeline

Advanced pipeline with hooks and transformations:

```typescript
import { createPipeline, schemaTransforms } from '@opengenerator/core'

const pipeline = createPipeline(generator, {
  schemaTransforms: [
    schemaTransforms.addTimestamps(),
    schemaTransforms.addSoftDelete(),
  ],
  hooks: {
    onStageStart: (event) => console.log(`Starting ${event.stage}`),
    onStageComplete: (event) => console.log(`Completed ${event.stage}`),
  },
})

const result = await pipeline.run(options)
```

### Configuration

Load configuration from file:

```typescript
import { loadConfig, defineConfig } from '@opengenerator/core'

// Load from opengenerator.config.ts
const { config } = await loadConfig()

// Define configuration with type safety
export default defineConfig({
  schema: './prisma/schema.prisma',
  output: './generated',
  api: {
    rest: { enabled: true, prefix: '/api/v1' },
    graphql: { enabled: true },
  },
  adapter: 'fastify',
  auth: { strategies: ['jwt'] },
})
```

### Template Engine

Built-in Handlebars template engine:

```typescript
import { templateEngine } from '@opengenerator/core'

// Register custom helper
templateEngine.registerHelper('customHelper', (value) => value.toUpperCase())

// Render template
const output = templateEngine.render(template, {
  schema,
  model,
  options: {},
  helpers: { timestamp: new Date().toISOString(), version: '1.0.0' },
})
```

### Plugin System

Register and discover plugins:

```typescript
import { globalRegistry, pluginLoader } from '@opengenerator/core'

// Register plugin
globalRegistry.register(myPlugin, 'parser')

// Load plugin from package
const plugin = await pluginLoader.load('@opengenerator/parser-prisma')

// List registered plugins
const parsers = globalRegistry.list('parser')
```

## Types

The core package exports all TypeScript types used across OpenGenerator:

```typescript
import type {
  // Schema IR
  SchemaIR,
  Model,
  Field,
  FieldType,
  Enum,
  Relation,

  // Plugin interfaces
  ParserPlugin,
  GeneratorPlugin,
  AdapterPlugin,
  AuthPlugin,
  DatabasePlugin,
  DeployPlugin,

  // Options
  GeneratorOptions,
  GeneratedCode,
  GeneratedFile,
  Dependency,
} from '@opengenerator/core'
```

## License

MIT - see [LICENSE](../../LICENSE) for details.
