import { describe, it, expect } from 'vitest'

import { validateConfig, defineConfig, mergeConfigs } from '../src/config'

describe('validateConfig', () => {
  it('should validate a minimal config', () => {
    const config = validateConfig({
      schema: './schema.prisma',
    })

    expect(config.schema).toBe('./schema.prisma')
    expect(config.output).toBe('./generated') // default
  })

  it('should validate a full config', () => {
    const config = validateConfig({
      schema: './prisma/schema.prisma',
      output: './src/generated',
      api: {
        rest: {
          enabled: true,
          prefix: '/api/v2',
        },
        graphql: {
          enabled: true,
          path: '/graphql',
        },
      },
      adapter: 'fastify',
      auth: {
        strategies: ['jwt', 'apikey'],
      },
    })

    expect(config.schema).toBe('./prisma/schema.prisma')
    expect(config.output).toBe('./src/generated')
    expect(config.adapter).toBe('fastify')
    expect(config.auth?.strategies).toContain('jwt')
    expect(config.auth?.strategies).toContain('apikey')
  })

  it('should apply default values', () => {
    const config = validateConfig({
      schema: './schema.json',
      api: {
        rest: { enabled: true },
      },
    })

    // REST defaults
    expect(config.api?.rest).toBeDefined()
    if (typeof config.api?.rest === 'object') {
      expect(config.api.rest.prefix).toBe('/api/v1')
      expect(config.api.rest.versioning).toBe(true)
      expect(config.api.rest.sorting).toBe(true)
      expect(config.api.rest.filtering).toBe(true)
    }
  })

  it('should reject invalid adapter', () => {
    expect(() =>
      validateConfig({
        schema: './schema.prisma',
        adapter: 'invalid' as 'express',
      })
    ).toThrow()
  })

  it('should reject invalid auth strategy', () => {
    expect(() =>
      validateConfig({
        schema: './schema.prisma',
        auth: {
          strategies: ['invalid' as 'jwt'],
        },
      })
    ).toThrow()
  })

  it('should accept boolean for REST config', () => {
    const config = validateConfig({
      schema: './schema.prisma',
      api: {
        rest: true,
      },
    })

    expect(config.api?.rest).toBe(true)
  })
})

describe('defineConfig', () => {
  it('should return the same config with validation', () => {
    const input = {
      schema: './schema.prisma',
      output: './generated',
    }

    const config = defineConfig(input)
    expect(config.schema).toBe(input.schema)
    expect(config.output).toBe(input.output)
  })

  it('should throw on invalid config', () => {
    expect(() =>
      defineConfig({
        // @ts-expect-error - testing invalid input
        invalid: true,
      })
    ).toThrow()
  })
})

describe('mergeConfigs', () => {
  it('should merge two configs', () => {
    const base = {
      schema: './base-schema.prisma',
      output: './generated',
    }

    const override = {
      output: './custom-output',
      adapter: 'fastify' as const,
    }

    const merged = mergeConfigs(base, override)
    expect(merged.schema).toBe('./base-schema.prisma')
    expect(merged.output).toBe('./custom-output')
    expect(merged.adapter).toBe('fastify')
  })

  it('should deep merge api config', () => {
    const base = {
      schema: './schema.prisma',
      api: {
        rest: { enabled: true, prefix: '/api' },
      },
    }

    const override = {
      api: {
        graphql: { enabled: true },
      },
    }

    const merged = mergeConfigs(base, override)
    expect(merged.api?.rest).toBeDefined()
    expect(merged.api?.graphql).toBeDefined()
  })
})
