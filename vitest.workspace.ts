import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'packages/parsers/*/vitest.config.ts',
  'packages/generators/*/vitest.config.ts',
  'packages/adapters/*/vitest.config.ts',
  'packages/auth/*/vitest.config.ts',
  'packages/database/*/vitest.config.ts',
  'packages/deploy/*/vitest.config.ts',
  'packages/presets/*/vitest.config.ts',
])
