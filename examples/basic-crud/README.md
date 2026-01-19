# Basic CRUD Example

A simple CRUD API example demonstrating OpenGenerator's basic functionality.

## Features

- REST API with Fastify
- Prisma ORM with SQLite
- Swagger documentation
- Zod validation

## Quick Start

```bash
# Install dependencies
pnpm install

# Push database schema
pnpm db:push

# Generate API code
pnpm generate

# Start development server
pnpm dev
```

## API Endpoints

After generation, the following endpoints will be available:

### Posts
- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Documentation

Access Swagger UI at http://localhost:3000/docs

## Project Structure

```
basic-crud/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── generated/         # Generated code (after running generate)
│   │   ├── post/
│   │   └── user/
│   └── index.ts           # Server entry point
├── opengenerator.config.ts
└── package.json
```

## Learn More

- [OpenGenerator Documentation](https://opengenerator.dev)
- [Prisma Documentation](https://prisma.io/docs)
- [Fastify Documentation](https://fastify.dev)
