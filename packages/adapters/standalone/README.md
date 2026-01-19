# @opengenerator/adapter-standalone

Standalone HTTP adapter for OpenGenerator. Uses Node.js built-in http module with zero external dependencies.

## Installation

```bash
npm install @opengenerator/adapter-standalone
```

## Usage

```typescript
import { createApp } from './generated'

const app = createApp({
  repositories: { ... }
})

await app.listen(3000)
```

## License

MIT
