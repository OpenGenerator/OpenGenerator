# @opengenerator/auth-jwt

JWT authentication plugin for OpenGenerator.

## Installation

```bash
npm install @opengenerator/auth-jwt
```

## Usage

```typescript
import { jwtService } from './generated/auth'

// Sign a token
const tokens = await jwtService.sign({
  sub: 'user-id',
  email: 'user@example.com',
  role: 'admin',
})

// Verify a token
const payload = await jwtService.verify(tokens.accessToken)

// Refresh tokens
const newTokens = await jwtService.refresh(tokens.refreshToken)
```

## License

MIT
