# OpenGenerator Playground

An interactive web-based playground for experimenting with OpenGenerator without any local setup.

## Features

- **Live Code Generation**: Write your schema and see generated code instantly
- **Multiple API Styles**: Switch between REST, GraphQL, and tRPC
- **Framework Selection**: Choose from Express, Fastify, Hono, or Koa
- **Database Adapters**: Generate code for Prisma, Drizzle, or Kysely
- **Validation Schemas**: Optionally generate Zod validation
- **Test Generation**: Optionally generate test files
- **Share Links**: Share your schema with a permalink
- **Dark Mode**: Easy on the eyes

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Monaco Editor** - Code editor (same as VS Code)
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible UI components
- **Zustand** - State management

## Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Entry point
├── store.ts         # Zustand store for state
├── generator.ts     # Mock code generator
├── utils.ts         # Utility functions
└── index.css        # Global styles
```

## How It Works

1. User enters their schema in the Monaco editor
2. User configures generation options (API style, framework, etc.)
3. User clicks "Generate"
4. The generator parses the schema and produces output files
5. Output is displayed in tabs on the right panel

## Future Improvements

- [ ] WebAssembly-based actual OpenGenerator core
- [ ] Real-time collaboration
- [ ] Template customization
- [ ] Export to GitHub Gist
- [ ] Deploy generated code directly

## Learn More

- [OpenGenerator Documentation](https://opengenerator.dev)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
