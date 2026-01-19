# @opengenerator/adapter-hono

Hono adapter for OpenGenerator. Optimized for edge runtimes.

## Installation

```bash
npm install @opengenerator/adapter-hono
```

## Usage

```typescript
import { createHonoAdapter } from '@opengenerator/adapter-hono'

const adapter = createHonoAdapter({
  runtime: 'cloudflare',
  cors: true,
})

const code = await adapter.generate(schema)
```

## License

MIT
