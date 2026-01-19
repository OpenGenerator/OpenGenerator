import { describe, it, expect } from 'vitest'
import { restGenerator, createRestGenerator } from '../src/index'
import type { SchemaIR, Model, Field } from '@opengenerator/core'

function createTestSchema(): SchemaIR {
  const idField: Field = {
    name: 'id',
    type: { kind: 'scalar', type: 'string' },
    required: true,
    primaryKey: true,
  }

  const emailField: Field = {
    name: 'email',
    type: { kind: 'scalar', type: 'string' },
    required: true,
  }

  const nameField: Field = {
    name: 'name',
    type: { kind: 'scalar', type: 'string' },
    required: false,
  }

  const userModel: Model = {
    name: 'User',
    fields: [idField, emailField, nameField],
    crud: { create: true, read: true, update: true, delete: true },
  }

  return {
    models: [userModel],
    enums: [],
    metadata: {
      source: 'test',
      name: 'TestSchema',
      version: '1.0.0',
    },
    relations: [],
    indices: [],
  }
}

describe('REST Generator', () => {
  describe('factory', () => {
    it('should create generator with default options', () => {
      expect(restGenerator.name).toBe('@opengenerator/gen-rest')
      expect(restGenerator.version).toBe('1.0.0')
      expect(restGenerator.style).toBe('rest')
    })

    it('should create generator with custom options', () => {
      const generator = createRestGenerator({
        prefix: '/api/v2',
        openapi: false,
        pagination: false,
      })
      expect(generator.name).toBe('@opengenerator/gen-rest')
    })
  })

  describe('generate', () => {
    it('should generate types file', async () => {
      const schema = createTestSchema()
      const result = await restGenerator.generate(schema, {})

      const typesFile = result.files.find((f) => f.path === 'types.ts')
      expect(typesFile).toBeDefined()
      expect(typesFile?.content).toContain('export interface User')
      expect(typesFile?.content).toContain('export interface UserCreateInput')
      expect(typesFile?.content).toContain('export interface UserUpdateInput')
      expect(typesFile?.content).toContain('export interface UserFilter')
    })

    it('should generate routes file', async () => {
      const schema = createTestSchema()
      const result = await restGenerator.generate(schema, {})

      const routesFile = result.files.find((f) => f.path === 'routes.ts')
      expect(routesFile).toBeDefined()
      expect(routesFile?.content).toContain("method: 'GET'")
      expect(routesFile?.content).toContain("method: 'POST'")
      expect(routesFile?.content).toContain("method: 'PUT'")
      expect(routesFile?.content).toContain("method: 'DELETE'")
      expect(routesFile?.content).toContain('/api/v1/user')
    })

    it('should generate controller file', async () => {
      const schema = createTestSchema()
      const result = await restGenerator.generate(schema, {})

      const controllerFile = result.files.find((f) => f.path === 'controllers/user.controller.ts')
      expect(controllerFile).toBeDefined()
      expect(controllerFile?.content).toContain('export class UserController')
      expect(controllerFile?.content).toContain('async list')
      expect(controllerFile?.content).toContain('async getById')
      expect(controllerFile?.content).toContain('async create')
      expect(controllerFile?.content).toContain('async update')
      expect(controllerFile?.content).toContain('async delete')
    })

    it('should generate OpenAPI spec by default', async () => {
      const schema = createTestSchema()
      const result = await restGenerator.generate(schema, {})

      const openapiFile = result.files.find((f) => f.path === 'openapi.json')
      expect(openapiFile).toBeDefined()

      const spec = JSON.parse(openapiFile?.content ?? '{}')
      expect(spec.openapi).toBe('3.0.3')
      expect(spec.paths['/api/v1/user']).toBeDefined()
      expect(spec.components.schemas.User).toBeDefined()
    })

    it('should generate validation schemas', async () => {
      const schema = createTestSchema()
      const result = await restGenerator.generate(schema, {})

      const validationFile = result.files.find((f) => f.path === 'validation.ts')
      expect(validationFile).toBeDefined()
      expect(validationFile?.content).toContain("import { z } from 'zod'")
      expect(validationFile?.content).toContain('userCreateSchema')
      expect(validationFile?.content).toContain('userUpdateSchema')
    })

    it('should respect custom prefix option', async () => {
      const generator = createRestGenerator({ prefix: '/api/v2' })
      const schema = createTestSchema()
      const result = await generator.generate(schema, {})

      const routesFile = result.files.find((f) => f.path === 'routes.ts')
      expect(routesFile?.content).toContain('/api/v2/user')
    })

    it('should skip OpenAPI generation when disabled', async () => {
      const generator = createRestGenerator({ openapi: false })
      const schema = createTestSchema()
      const result = await generator.generate(schema, {})

      const openapiFile = result.files.find((f) => f.path === 'openapi.json')
      expect(openapiFile).toBeUndefined()
    })

    it('should skip validation generation when disabled', async () => {
      const generator = createRestGenerator({ validation: false })
      const schema = createTestSchema()
      const result = await generator.generate(schema, {})

      const validationFile = result.files.find((f) => f.path === 'validation.ts')
      expect(validationFile).toBeUndefined()
    })

    it('should include zod dependency when validation is enabled', async () => {
      const schema = createTestSchema()
      const result = await restGenerator.generate(schema, {})

      const zodDep = result.dependencies.find((d) => d.name === 'zod')
      expect(zodDep).toBeDefined()
      expect(zodDep?.version).toBe('^3.22.0')
    })

    it('should generate index file with exports', async () => {
      const schema = createTestSchema()
      const result = await restGenerator.generate(schema, {})

      const indexFile = result.files.find((f) => f.path === 'index.ts')
      expect(indexFile).toBeDefined()
      expect(indexFile?.content).toContain("export * from './types'")
      expect(indexFile?.content).toContain("export * from './routes'")
      expect(indexFile?.content).toContain("export * from './controllers/user.controller'")
    })
  })

  describe('getDependencies', () => {
    it('should return zod dependency when validation is enabled', () => {
      const deps = restGenerator.getDependencies()
      expect(deps.find((d) => d.name === 'zod')).toBeDefined()
    })

    it('should return empty array when validation is disabled', () => {
      const generator = createRestGenerator({ validation: false })
      const deps = generator.getDependencies()
      expect(deps).toHaveLength(0)
    })
  })
})
