import { describe, it, expect } from 'vitest'

import { jsonSchemaParser, createJsonSchemaParser } from '../src/index'

describe('JSON Schema Parser', () => {
  describe('factory', () => {
    it('should create parser with default options', () => {
      const parser = jsonSchemaParser()
      expect(parser.name).toBe('json-schema')
      expect(parser.extensions).toContain('.json')
    })

    it('should create parser with custom options', () => {
      const parser = createJsonSchemaParser({
        draft: '2020-12',
        extractRefs: true,
      })
      expect(parser.name).toBe('json-schema')
    })
  })

  describe('canParse', () => {
    it('should accept valid JSON Schema content', () => {
      const parser = jsonSchemaParser()
      // canParse takes content, not file path - returns truthy values
      expect(parser.canParse(JSON.stringify({ $schema: 'http://json-schema.org/draft-07/schema#' }))).toBeTruthy()
      expect(parser.canParse(JSON.stringify({ type: 'object', properties: {} }))).toBeTruthy()
      expect(parser.canParse(JSON.stringify({ definitions: { User: {} } }))).toBeTruthy()
    })

    it('should reject invalid content', () => {
      const parser = jsonSchemaParser()
      // Returns falsy values for invalid content
      expect(parser.canParse('not valid json')).toBeFalsy()
      expect(parser.canParse(JSON.stringify({ random: 'data' }))).toBeFalsy()
    })
  })

  describe('parse', () => {
    it('should parse simple schema with definitions', async () => {
      const parser = jsonSchemaParser()
      const schema = await parser.parse(
        JSON.stringify({
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'TestSchema',
          definitions: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                age: { type: 'integer' },
              },
              required: ['id', 'email'],
            },
          },
        })
      )

      expect(schema.models).toHaveLength(1)
      expect(schema.models[0]?.name).toBe('User')
      expect(schema.models[0]?.fields).toHaveLength(4)

      const idField = schema.models[0]?.fields.find((f) => f.name === 'id')
      expect(idField?.required).toBe(true)
      expect(idField?.type.kind).toBe('scalar')

      const emailField = schema.models[0]?.fields.find((f) => f.name === 'email')
      expect(emailField?.required).toBe(true)

      const nameField = schema.models[0]?.fields.find((f) => f.name === 'name')
      expect(nameField?.required).toBe(false)
    })

    it('should parse schema with enum', async () => {
      const parser = jsonSchemaParser()
      const schema = await parser.parse(
        JSON.stringify({
          definitions: {
            Status: {
              type: 'string',
              enum: ['active', 'inactive', 'pending'],
            },
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                status: { $ref: '#/definitions/Status' },
              },
            },
          },
        })
      )

      expect(schema.enums).toHaveLength(1)
      expect(schema.enums[0]?.name).toBe('Status')
      // Enum values are objects with name and value properties
      expect(schema.enums[0]?.values).toEqual([
        { name: 'ACTIVE', value: 'active' },
        { name: 'INACTIVE', value: 'inactive' },
        { name: 'PENDING', value: 'pending' },
      ])
    })

    it('should parse schema with arrays', async () => {
      const parser = jsonSchemaParser()
      const schema = await parser.parse(
        JSON.stringify({
          definitions: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
          },
        })
      )

      const tagsField = schema.models[0]?.fields.find((f) => f.name === 'tags')
      expect(tagsField?.type.kind).toBe('array')
    })

    it('should extract validation rules', async () => {
      const parser = jsonSchemaParser()
      const schema = await parser.parse(
        JSON.stringify({
          definitions: {
            User: {
              type: 'object',
              properties: {
                username: {
                  type: 'string',
                  minLength: 3,
                  maxLength: 50,
                  pattern: '^[a-z]+$',
                },
                age: {
                  type: 'integer',
                  minimum: 0,
                  maximum: 150,
                },
              },
            },
          },
        })
      )

      const usernameField = schema.models[0]?.fields.find((f) => f.name === 'username')
      // Validation uses flat structure
      expect(usernameField?.validation?.minLength).toBe(3)
      expect(usernameField?.validation?.maxLength).toBe(50)
      expect(usernameField?.validation?.pattern).toBe('^[a-z]+$')

      const ageField = schema.models[0]?.fields.find((f) => f.name === 'age')
      // minimum/maximum are mapped to min/max
      expect(ageField?.validation?.min).toBe(0)
      expect(ageField?.validation?.max).toBe(150)
    })

    it('should handle nullable types', async () => {
      const parser = jsonSchemaParser()
      const schema = await parser.parse(
        JSON.stringify({
          definitions: {
            User: {
              type: 'object',
              properties: {
                nickname: {
                  type: ['string', 'null'],
                },
              },
            },
          },
        })
      )

      const nicknameField = schema.models[0]?.fields.find((f) => f.name === 'nickname')
      expect(nicknameField?.required).toBe(false)
    })

    it('should set metadata correctly', async () => {
      const parser = jsonSchemaParser()
      const schema = await parser.parse(
        JSON.stringify({
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'MyAPI',
          definitions: {
            User: { type: 'object', properties: {} },
          },
        })
      )

      expect(schema.metadata.source).toBe('json-schema')
      expect(schema.metadata.name).toBe('MyAPI')
    })

    it('should handle references between definitions', async () => {
      const parser = jsonSchemaParser()
      const schema = await parser.parse(
        JSON.stringify({
          definitions: {
            Address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
              },
            },
            User: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                address: { $ref: '#/definitions/Address' },
              },
            },
          },
        })
      )

      expect(schema.models).toHaveLength(2)
      const userModel = schema.models.find((m) => m.name === 'User')
      const addressField = userModel?.fields.find((f) => f.name === 'address')
      expect(addressField?.type.kind).toBe('reference')
    })
  })

  describe('validate', () => {
    it('should validate correct JSON Schema', () => {
      const parser = jsonSchemaParser()
      const result = parser.validate?.(
        JSON.stringify({
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        })
      )

      expect(result?.valid).toBe(true)
    })

    it('should reject invalid JSON', () => {
      const parser = jsonSchemaParser()
      const result = parser.validate?.('not valid json')

      expect(result?.valid).toBe(false)
    })
  })
})
