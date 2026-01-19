import { describe, it, expect } from 'vitest'

import { mergeGeneratedCode, mergeDependencies } from '../src/types/generator'
import type { GeneratedCode, Dependency } from '../src/types/generator'

describe('mergeGeneratedCode', () => {
  const createFile = (path: string, content: string) => ({ path, content })

  it('should merge files from both sources', () => {
    const a: GeneratedCode = {
      files: [createFile('a.ts', 'content-a')],
      dependencies: [],
    }
    const b: GeneratedCode = {
      files: [createFile('b.ts', 'content-b')],
      dependencies: [],
    }

    const result = mergeGeneratedCode(a, b)
    expect(result.files).toHaveLength(2)
    expect(result.files.map((f) => f.path)).toContain('a.ts')
    expect(result.files.map((f) => f.path)).toContain('b.ts')
  })

  it('should deduplicate files with same path (last-wins by default)', () => {
    const a: GeneratedCode = {
      files: [createFile('index.ts', 'old content')],
      dependencies: [],
    }
    const b: GeneratedCode = {
      files: [createFile('index.ts', 'new content')],
      dependencies: [],
    }

    const result = mergeGeneratedCode(a, b)
    expect(result.files).toHaveLength(1)
    expect(result.files[0]?.content).toBe('new content')
  })

  it('should respect first-wins strategy', () => {
    const a: GeneratedCode = {
      files: [createFile('index.ts', 'first content')],
      dependencies: [],
    }
    const b: GeneratedCode = {
      files: [createFile('index.ts', 'second content')],
      dependencies: [],
    }

    const result = mergeGeneratedCode(a, b, { fileStrategy: 'first-wins' })
    expect(result.files).toHaveLength(1)
    expect(result.files[0]?.content).toBe('first content')
  })

  it('should throw error with error strategy on conflict', () => {
    const a: GeneratedCode = {
      files: [createFile('index.ts', 'content')],
      dependencies: [],
    }
    const b: GeneratedCode = {
      files: [createFile('index.ts', 'other content')],
      dependencies: [],
    }

    expect(() => mergeGeneratedCode(a, b, { fileStrategy: 'error' })).toThrow(
      'File conflict: index.ts'
    )
  })

  it('should merge dependencies', () => {
    const a: GeneratedCode = {
      files: [],
      dependencies: [{ name: 'dep-a', version: '^1.0.0' }],
    }
    const b: GeneratedCode = {
      files: [],
      dependencies: [{ name: 'dep-b', version: '^2.0.0' }],
    }

    const result = mergeGeneratedCode(a, b)
    expect(result.dependencies).toHaveLength(2)
  })
})

describe('mergeDependencies', () => {
  it('should merge unique dependencies', () => {
    const a: Dependency[] = [{ name: 'express', version: '^4.0.0' }]
    const b: Dependency[] = [{ name: 'fastify', version: '^4.0.0' }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(2)
    expect(result.map((d) => d.name)).toContain('express')
    expect(result.map((d) => d.name)).toContain('fastify')
  })

  it('should prefer higher major version', () => {
    const a: Dependency[] = [{ name: 'lodash', version: '^3.0.0' }]
    const b: Dependency[] = [{ name: 'lodash', version: '^4.0.0' }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(1)
    expect(result[0]?.version).toBe('^4.0.0')
  })

  it('should prefer higher minor version', () => {
    const a: Dependency[] = [{ name: 'lodash', version: '^4.5.0' }]
    const b: Dependency[] = [{ name: 'lodash', version: '^4.17.0' }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(1)
    expect(result[0]?.version).toBe('^4.17.0')
  })

  it('should prefer higher patch version', () => {
    const a: Dependency[] = [{ name: 'lodash', version: '^4.17.20' }]
    const b: Dependency[] = [{ name: 'lodash', version: '^4.17.21' }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(1)
    expect(result[0]?.version).toBe('^4.17.21')
  })

  it('should handle tilde versions', () => {
    const a: Dependency[] = [{ name: 'pkg', version: '~1.0.0' }]
    const b: Dependency[] = [{ name: 'pkg', version: '~2.0.0' }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(1)
    expect(result[0]?.version).toBe('~2.0.0')
  })

  it('should prefer release over prerelease', () => {
    const a: Dependency[] = [{ name: 'pkg', version: '^1.0.0-beta.1' }]
    const b: Dependency[] = [{ name: 'pkg', version: '^1.0.0' }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(1)
    expect(result[0]?.version).toBe('^1.0.0')
  })

  it('should handle exact versions', () => {
    const a: Dependency[] = [{ name: 'pkg', version: '1.0.0' }]
    const b: Dependency[] = [{ name: 'pkg', version: '2.0.0' }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(1)
    expect(result[0]?.version).toBe('2.0.0')
  })

  it('should merge dev flag - false takes precedence', () => {
    const a: Dependency[] = [{ name: 'pkg', version: '^1.0.0', dev: true }]
    const b: Dependency[] = [{ name: 'pkg', version: '^1.0.0', dev: false }]

    const result = mergeDependencies(a, b)
    expect(result).toHaveLength(1)
    expect(result[0]?.dev).toBe(false)
  })

  it('should handle empty arrays', () => {
    expect(mergeDependencies([], [])).toEqual([])
    expect(mergeDependencies([{ name: 'pkg', version: '1.0.0' }], [])).toHaveLength(1)
    expect(mergeDependencies([], [{ name: 'pkg', version: '1.0.0' }])).toHaveLength(1)
  })
})
