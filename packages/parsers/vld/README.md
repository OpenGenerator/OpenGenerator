# @opengenerator/parser-vld

VLD (Validation Library for Data) schema parser for OpenGenerator.

## Installation

```bash
npm install @opengenerator/parser-vld
# or
pnpm add @opengenerator/parser-vld
```

## Usage

```typescript
import { createVldParser } from '@opengenerator/parser-vld'

const parser = createVldParser()

const schema = `
import { v } from 'vld'

export const userSchema = v.schema({
  name: v.string().min(1).max(100),
  email: v.string().email(),
  age: v.number().int().positive().optional(),
  role: v.enum(['admin', 'user', 'guest']).default('user'),
  posts: v.array(v.ref('Post')),
})

export const postSchema = v.schema({
  title: v.string().min(1).max(200),
  content: v.string(),
  published: v.boolean().default(false),
  author: v.ref('User'),
})
`

const schemaIR = await parser.parse(schema)
console.log(schemaIR.models)
```

## Supported VLD Features

### Types

- `v.string()` - String type
- `v.number()` - Number type (Int/Float)
- `v.boolean()` - Boolean type
- `v.date()` - DateTime type
- `v.json()` / `v.object()` - JSON type
- `v.bigint()` - BigInt type
- `v.bytes()` - Bytes type

### Modifiers

- `.optional()` - Make field optional
- `.nullable()` - Allow null values
- `.array()` - Array of values
- `.unique()` - Unique constraint
- `.default(value)` - Default value

### Validations

- `.min(n)` - Minimum value/length
- `.max(n)` - Maximum value/length
- `.length(n)` - Exact length
- `.pattern(regex)` - Regex pattern
- `.email()` - Email format
- `.url()` - URL format
- `.uuid()` - UUID format
- `.positive()` - Positive number
- `.negative()` - Negative number
- `.int()` - Integer only

### Relations

- `.ref('ModelName')` - Reference to another model

### Enums

- `.enum(['a', 'b', 'c'])` - Enumeration

## Options

```typescript
const parser = createVldParser({
  // Custom type mappings
  typeMappings: {
    money: 'Decimal',
    phone: 'String',
  },

  // Include validation rules in output
  includeValidation: true,

  // Extract relations from schema
  extractRelations: true,
})
```

## License

MIT
