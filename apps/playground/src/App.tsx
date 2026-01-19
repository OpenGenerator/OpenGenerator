import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import * as Tabs from '@radix-ui/react-tabs'
import * as Select from '@radix-ui/react-select'
import { Play, Download, Share2, Moon, Sun, ChevronDown } from 'lucide-react'
import { usePlaygroundStore } from './store'
import { generateCode } from './generator'
import { cn } from './utils'

const DEFAULT_SCHEMA = `// Prisma Schema Example
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`

export default function App() {
  const { darkMode, toggleDarkMode, config, setConfig } = usePlaygroundStore()
  const [schema, setSchema] = useState(DEFAULT_SCHEMA)
  const [output, setOutput] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState('schema')
  const [activeOutputTab, setActiveOutputTab] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    try {
      const result = await generateCode(schema, config)
      setOutput(result)
      setActiveOutputTab(Object.keys(result)[0] || '')
    } catch (error) {
      console.error('Generation error:', error)
      setOutput({
        'error.txt': `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
      setActiveOutputTab('error.txt')
    } finally {
      setIsGenerating(false)
    }
  }, [schema, config])

  const handleShare = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('schema', btoa(schema))
    url.searchParams.set('config', btoa(JSON.stringify(config)))
    await navigator.clipboard.writeText(url.toString())
    alert('Link copied to clipboard!')
  }

  const handleDownload = () => {
    const zip = Object.entries(output)
      .map(([name, content]) => `// ${name}\n${content}`)
      .join('\n\n// ---\n\n')
    const blob = new Blob([zip], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'generated-code.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('min-h-screen', darkMode && 'dark')}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        {/* Header */}
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                OpenGenerator
              </h1>
              <span className="text-sm text-gray-500 dark:text-gray-400">Playground</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={16} />
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>

              <button
                onClick={handleShare}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Share"
              >
                <Share2 size={18} />
              </button>

              <button
                onClick={handleDownload}
                disabled={Object.keys(output).length === 0}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                title="Download"
              >
                <Download size={18} />
              </button>

              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-screen-2xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-120px)]">
            {/* Input panel */}
            <div className="flex flex-col bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                <Tabs.List className="flex border-b border-gray-200 dark:border-gray-800">
                  <Tabs.Trigger
                    value="schema"
                    className="px-4 py-2.5 text-sm font-medium data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                  >
                    Schema
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="config"
                    className="px-4 py-2.5 text-sm font-medium data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                  >
                    Config
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="schema" className="flex-1 overflow-hidden">
                  <Editor
                    height="100%"
                    language="prisma"
                    theme={darkMode ? 'vs-dark' : 'light'}
                    value={schema}
                    onChange={(value) => setSchema(value || '')}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </Tabs.Content>

                <Tabs.Content value="config" className="flex-1 p-4 overflow-auto">
                  <ConfigPanel config={config} setConfig={setConfig} />
                </Tabs.Content>
              </Tabs.Root>
            </div>

            {/* Output panel */}
            <div className="flex flex-col bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {Object.keys(output).length > 0 ? (
                <Tabs.Root value={activeOutputTab} onValueChange={setActiveOutputTab} className="flex flex-col h-full">
                  <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800">
                    <Tabs.List className="flex">
                      {Object.keys(output).map((file) => (
                        <Tabs.Trigger
                          key={file}
                          value={file}
                          className="px-3 py-2 text-sm font-mono whitespace-nowrap data-[state=active]:text-blue-600 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950"
                        >
                          {file}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.List>
                  </div>

                  {Object.entries(output).map(([file, content]) => (
                    <Tabs.Content key={file} value={file} className="flex-1 overflow-hidden">
                      <Editor
                        height="100%"
                        language={file.endsWith('.ts') ? 'typescript' : file.endsWith('.graphql') ? 'graphql' : 'plaintext'}
                        theme={darkMode ? 'vs-dark' : 'light'}
                        value={content}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 14,
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                        }}
                      />
                    </Tabs.Content>
                  ))}
                </Tabs.Root>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <Play size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Click "Generate" to see the output</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function ConfigPanel({
  config,
  setConfig,
}: {
  config: { api: 'rest' | 'graphql' | 'trpc'; adapter: 'express' | 'fastify' | 'hono' | 'koa'; database: 'prisma' | 'drizzle' | 'kysely'; validation: boolean; tests: boolean }
  setConfig: (updates: Partial<{ api: 'rest' | 'graphql' | 'trpc'; adapter: 'express' | 'fastify' | 'hono' | 'koa'; database: 'prisma' | 'drizzle' | 'kysely'; validation: boolean; tests: boolean }>) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">API Style</label>
        <Select.Root value={config.api} onValueChange={(value) => setConfig({ api: value as any })}>
          <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <Select.Value />
            <Select.Icon>
              <ChevronDown size={16} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
              <Select.Viewport>
                <Select.Item value="rest" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>REST API</Select.ItemText>
                </Select.Item>
                <Select.Item value="graphql" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>GraphQL</Select.ItemText>
                </Select.Item>
                <Select.Item value="trpc" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>tRPC</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Framework</label>
        <Select.Root value={config.adapter} onValueChange={(value) => setConfig({ adapter: value as any })}>
          <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <Select.Value />
            <Select.Icon>
              <ChevronDown size={16} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
              <Select.Viewport>
                <Select.Item value="express" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>Express</Select.ItemText>
                </Select.Item>
                <Select.Item value="fastify" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>Fastify</Select.ItemText>
                </Select.Item>
                <Select.Item value="hono" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>Hono</Select.ItemText>
                </Select.Item>
                <Select.Item value="koa" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>Koa</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Database</label>
        <Select.Root value={config.database} onValueChange={(value) => setConfig({ database: value as any })}>
          <Select.Trigger className="w-full flex items-center justify-between px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <Select.Value />
            <Select.Icon>
              <ChevronDown size={16} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
              <Select.Viewport>
                <Select.Item value="prisma" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>Prisma</Select.ItemText>
                </Select.Item>
                <Select.Item value="drizzle" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>Drizzle</Select.ItemText>
                </Select.Item>
                <Select.Item value="kysely" className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <Select.ItemText>Kysely</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Generate Validation</label>
        <button
          onClick={() => setConfig({ validation: !config.validation })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors',
            config.validation ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform',
              config.validation ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Generate Tests</label>
        <button
          onClick={() => setConfig({ tests: !config.tests })}
          className={cn(
            'w-11 h-6 rounded-full transition-colors',
            config.tests ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
          )}
        >
          <span
            className={cn(
              'block w-5 h-5 rounded-full bg-white shadow transition-transform',
              config.tests ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>
    </div>
  )
}
