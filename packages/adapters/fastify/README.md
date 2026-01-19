# @opengenerator/adapter-fastify

Fastify adapter for OpenGenerator.

## Installation

```bash
npm install @opengenerator/adapter-fastify
```

## Usage

```typescript
import { createFastifyAdapter } from '@opengenerator/adapter-fastify'

const adapter = createFastifyAdapter({
  swagger: true,
  cors: true,
  helmet: true,
})

const code = await adapter.generate(schema)
```

## License

MIT
