# @opengenerator/adapter-express

Express adapter for OpenGenerator.

## Installation

```bash
npm install @opengenerator/adapter-express
# or
pnpm add @opengenerator/adapter-express
```

## Usage

```typescript
import { createExpressAdapter } from '@opengenerator/adapter-express'

const adapter = createExpressAdapter({
  cors: true,
  helmet: true,
  logging: true,
  errorHandler: true,
  prefix: '/api/v1',
})

const code = await adapter.generate(schema)
```

## Options

```typescript
interface ExpressAdapterOptions {
  asyncHandler?: boolean   // Wrap async handlers (default: true)
  validation?: boolean     // Validation middleware (default: true)
  rateLimiting?: boolean   // Rate limiting (default: false)
  cors?: boolean          // CORS middleware (default: true)
  helmet?: boolean        // Security headers (default: true)
  logging?: boolean       // Request logging (default: true)
  compression?: boolean   // Response compression (default: true)
  errorHandler?: boolean  // Error handling (default: true)
  openapi?: boolean       // OpenAPI route (default: true)
  prefix?: string         // Route prefix (default: '/api')
}
```

## License

MIT
