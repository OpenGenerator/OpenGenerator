/**
 * @opengenerator/preset-minimal-rest
 * Minimal REST preset: JSON Schema + REST + Standalone + API Key
 */

import type { OpenGeneratorConfig } from '@opengenerator/core'

export const minimalRestPreset: Partial<OpenGeneratorConfig> = {
  schema: './schema.json',
  api: {
    rest: { enabled: true, prefix: '/api', versioning: false, sorting: false, filtering: false },
  },
  adapter: 'standalone',
  auth: {
    strategies: ['apikey']
  },
  output: './generated',
}

export default minimalRestPreset
