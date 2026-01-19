# OpenGenerator Documentation Website

The official documentation website for OpenGenerator, built with Astro and Starlight.

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

## Structure

```
src/
├── assets/           # Images and static assets
├── components/       # Custom Astro/React components
├── content/
│   └── docs/         # Documentation markdown files
│       ├── guides/   # Getting started guides
│       ├── parsers/  # Schema parser docs
│       ├── generators/ # API generator docs
│       ├── adapters/ # Framework adapter docs
│       ├── auth/     # Authentication docs
│       ├── database/ # Database adapter docs
│       ├── deploy/   # Deployment docs
│       ├── presets/  # Preset docs
│       ├── advanced/ # Advanced topics
│       └── reference/ # API reference
└── styles/          # Custom CSS
```

## Adding Documentation

1. Create a new `.md` or `.mdx` file in the appropriate directory
2. Add frontmatter:

```md
---
title: Your Page Title
description: Brief description for SEO
---

# Your Content Here
```

3. Update the sidebar in `astro.config.mjs` if needed

## Components

Starlight provides built-in components:

```mdx
import { Card, CardGrid, Tabs, TabItem } from '@astrojs/starlight/components';

<Card title="Example">Content here</Card>

<Tabs>
  <TabItem label="npm">npm install</TabItem>
  <TabItem label="pnpm">pnpm add</TabItem>
</Tabs>
```

## Deployment

The site is automatically deployed to Vercel on push to main.

Manual deployment:

```bash
pnpm build
# Upload dist/ to your hosting provider
```

## Learn More

- [Astro Documentation](https://docs.astro.build)
- [Starlight Documentation](https://starlight.astro.build)
