import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PlaygroundConfig {
  api: 'rest' | 'graphql' | 'trpc'
  adapter: 'express' | 'fastify' | 'hono' | 'koa'
  database: 'prisma' | 'drizzle' | 'kysely'
  validation: boolean
  tests: boolean
}

interface PlaygroundState {
  darkMode: boolean
  config: PlaygroundConfig
  toggleDarkMode: () => void
  setConfig: (updates: Partial<PlaygroundConfig>) => void
}

export const usePlaygroundStore = create<PlaygroundState>()(
  persist(
    (set) => ({
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      config: {
        api: 'rest',
        adapter: 'fastify',
        database: 'prisma',
        validation: true,
        tests: false,
      },
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setConfig: (updates) =>
        set((state) => ({
          config: { ...state.config, ...updates },
        })),
    }),
    {
      name: 'opengenerator-playground',
    }
  )
)
