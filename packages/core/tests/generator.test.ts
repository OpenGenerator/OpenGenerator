import { describe, it, expect, beforeEach } from 'vitest'

import { OpenGenerator, createGenerator } from '../src/generator'
import type { ParserPlugin, GeneratorPlugin, SchemaIR } from '../src/types'

// Mock parser plugin
const mockParser: ParserPlugin = {
  name: 'mock-parser',
  version: '1.0.0',
  extensions: ['.mock'],
  canParse: () => true,
  parse: async (input) => ({
    version: '1.0.0',
    metadata: {
      name: 'test',
      source: 'prisma',
    },
    models: [
      {
        name: 'User',
        fields: [
          {
            name: 'id',
            type: { kind: 'scalar', type: 'string' },
            required: true,
            primaryKey: true,
          },
          {
            name: 'email',
            type: { kind: 'scalar', type: 'string' },
            required: true,
            unique: true,
          },
          {
            name: 'name',
            type: { kind: 'scalar', type: 'string' },
            required: false,
          },
        ],
        crud: {
          create: true,
          read: true,
          update: true,
          delete: true,
          list: true,
        },
      },
    ],
    enums: [],
    relations: [],
  }),
}

// Mock generator plugin
const mockGenerator: GeneratorPlugin = {
  name: 'mock-generator',
  version: '1.0.0',
  style: 'rest',
  generate: async (schema, options) => ({
    files: [
      {
        path: 'src/routes/users.ts',
        content: `// User routes\nexport const userRoutes = {}`,
      },
    ],
    dependencies: [{ name: 'express', version: '^4.18.0' }],
  }),
  getDependencies: () => [{ name: 'express', version: '^4.18.0' }],
}

describe('OpenGenerator', () => {
  let generator: OpenGenerator

  beforeEach(() => {
    generator = createGenerator()
  })

  describe('createGenerator', () => {
    it('should create a new OpenGenerator instance', () => {
      expect(generator).toBeInstanceOf(OpenGenerator)
    })
  })

  describe('parser', () => {
    it('should register and select a parser plugin', () => {
      generator.parser(mockParser)
      expect(generator.getParser()).toBe(mockParser)
    })

    it('should return this for chaining', () => {
      const result = generator.parser(mockParser)
      expect(result).toBe(generator)
    })
  })

  describe('generator', () => {
    it('should register and select a generator plugin', () => {
      generator.generator(mockGenerator)
      expect(generator.getGenerators()).toContain(mockGenerator)
    })

    it('should allow multiple generators', () => {
      const anotherGenerator: GeneratorPlugin = {
        ...mockGenerator,
        name: 'another-generator',
        style: 'graphql',
      }
      generator.generator(mockGenerator)
      generator.generator(anotherGenerator)
      expect(generator.getGenerators()).toHaveLength(2)
    })
  })

  describe('parse', () => {
    it('should throw error if no parser is selected', async () => {
      await expect(generator.parse('test')).rejects.toThrow('No parser selected')
    })

    it('should parse input using selected parser', async () => {
      generator.parser(mockParser)
      const schema = await generator.parse('test input')
      expect(schema.version).toBe('1.0.0')
      expect(schema.models).toHaveLength(1)
      expect(schema.models[0]?.name).toBe('User')
    })
  })

  describe('generate', () => {
    it('should generate code from schema', async () => {
      generator.parser(mockParser).generator(mockGenerator)

      const result = await generator.generate({
        schema: 'test',
        output: './test-output',
        write: false,
      })

      expect(result.files).toHaveLength(1)
      expect(result.files[0]?.path).toBe('src/routes/users.ts')
      expect(result.dependencies).toHaveLength(1)
    })
  })

  describe('validate', () => {
    it('should return errors if no parser selected', () => {
      const result = generator.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('No parser selected')
    })

    it('should return errors if no generators selected', () => {
      generator.parser(mockParser)
      const result = generator.validate()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('No generators selected')
    })

    it('should be valid with parser and generator', () => {
      generator.parser(mockParser).generator(mockGenerator)
      const result = generator.validate()
      expect(result.valid).toBe(true)
    })

    it('should warn if no adapter selected', () => {
      generator.parser(mockParser).generator(mockGenerator)
      const result = generator.validate()
      expect(result.warnings.some((w) => w.includes('adapter'))).toBe(true)
    })
  })

  describe('reset', () => {
    it('should clear all selections', () => {
      generator.parser(mockParser).generator(mockGenerator)
      generator.reset()
      expect(generator.getParser()).toBeUndefined()
      expect(generator.getGenerators()).toHaveLength(0)
    })
  })

  describe('clone', () => {
    it('should create a copy with same configuration', () => {
      generator.parser(mockParser).generator(mockGenerator)
      const cloned = generator.clone()
      expect(cloned.getParser()).toBe(mockParser)
      expect(cloned.getGenerators()).toEqual(generator.getGenerators())
    })

    it('should be independent from original', () => {
      generator.parser(mockParser)
      const cloned = generator.clone()
      cloned.generator(mockGenerator)
      expect(generator.getGenerators()).toHaveLength(0)
      expect(cloned.getGenerators()).toHaveLength(1)
    })
  })
})
