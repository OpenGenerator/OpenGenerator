import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import tailwind from '@astrojs/tailwind'
import react from '@astrojs/react'

export default defineConfig({
  // Remove site to disable sitemap generation
  integrations: [
    starlight({
      title: 'OpenGenerator',
      description: 'Schema-to-API Code Generator - Transform your schemas into production-ready APIs',
      logo: {
        src: './src/assets/logo.svg',
      },
      social: {
        github: 'https://github.com/opengenerator/opengenerator',
        discord: 'https://discord.gg/opengenerator',
        twitter: 'https://twitter.com/opengenerator',
      },
      editLink: {
        baseUrl: 'https://github.com/opengenerator/opengenerator/edit/main/apps/web/',
      },
      sidebar: [
        {
          label: 'Getting Started',
          items: [
            { label: 'Introduction', link: '/guides/introduction/' },
            { label: 'Quick Start', link: '/guides/quick-start/' },
            { label: 'Installation', link: '/guides/installation/' },
            { label: 'Configuration', link: '/guides/configuration/' },
          ],
        },
        {
          label: 'Schema Parsers',
          items: [
            { label: 'Overview', link: '/parsers/overview/' },
            { label: 'Prisma', link: '/parsers/prisma/' },
            { label: 'OpenAPI', link: '/parsers/openapi/' },
            { label: 'JSON Schema', link: '/parsers/json-schema/' },
            { label: 'Zod', link: '/parsers/zod/' },
            { label: 'TypeBox', link: '/parsers/typebox/' },
            { label: 'VLD', link: '/parsers/vld/' },
          ],
        },
        {
          label: 'API Generators',
          items: [
            { label: 'Overview', link: '/generators/overview/' },
            { label: 'REST API', link: '/generators/rest/' },
            { label: 'GraphQL', link: '/generators/graphql/' },
            { label: 'tRPC', link: '/generators/trpc/' },
          ],
        },
        {
          label: 'Framework Adapters',
          items: [
            { label: 'Overview', link: '/adapters/overview/' },
            { label: 'Express', link: '/adapters/express/' },
            { label: 'Fastify', link: '/adapters/fastify/' },
            { label: 'Hono', link: '/adapters/hono/' },
            { label: 'Koa', link: '/adapters/koa/' },
            { label: 'Standalone', link: '/adapters/standalone/' },
          ],
        },
        {
          label: 'Authentication',
          items: [
            { label: 'Overview', link: '/auth/overview/' },
            { label: 'JWT', link: '/auth/jwt/' },
            { label: 'OAuth', link: '/auth/oauth/' },
            { label: 'Session', link: '/auth/session/' },
            { label: 'API Key', link: '/auth/apikey/' },
            { label: 'Magic Link', link: '/auth/magic-link/' },
            { label: 'Passkey', link: '/auth/passkey/' },
          ],
        },
        {
          label: 'Database',
          items: [
            { label: 'Overview', link: '/database/overview/' },
            { label: 'Prisma', link: '/database/prisma/' },
            { label: 'Drizzle', link: '/database/drizzle/' },
            { label: 'Kysely', link: '/database/kysely/' },
            { label: 'TypeORM', link: '/database/typeorm/' },
            { label: 'Mongoose', link: '/database/mongoose/' },
            { label: 'Raw SQL', link: '/database/raw-sql/' },
          ],
        },
        {
          label: 'Deployment',
          items: [
            { label: 'Overview', link: '/deploy/overview/' },
            { label: 'Docker', link: '/deploy/docker/' },
            { label: 'Vercel', link: '/deploy/vercel/' },
            { label: 'Railway', link: '/deploy/railway/' },
            { label: 'Fly.io', link: '/deploy/fly/' },
            { label: 'AWS Lambda', link: '/deploy/lambda/' },
            { label: 'Kubernetes', link: '/deploy/kubernetes/' },
          ],
        },
        {
          label: 'Presets',
          items: [
            { label: 'Overview', link: '/presets/overview/' },
            { label: 'Fullstack Prisma', link: '/presets/fullstack-prisma/' },
            { label: 'Serverless Drizzle', link: '/presets/serverless-drizzle/' },
            { label: 'GraphQL Apollo', link: '/presets/graphql-apollo/' },
            { label: 'Minimal REST', link: '/presets/minimal-rest/' },
            { label: 'Enterprise', link: '/presets/enterprise/' },
          ],
        },
        {
          label: 'Advanced',
          items: [
            { label: 'Plugin System', link: '/advanced/plugins/' },
            { label: 'Custom Templates', link: '/advanced/templates/' },
            { label: 'Multi-Tenancy', link: '/advanced/multi-tenancy/' },
            { label: 'Microservices', link: '/advanced/microservices/' },
            { label: 'Testing', link: '/advanced/testing/' },
          ],
        },
        {
          label: 'API Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
    tailwind({ applyBaseStyles: false }),
    react(),
  ],
})
