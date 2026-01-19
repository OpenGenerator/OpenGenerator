/**
 * Integration test for Basic CRUD API
 */

import http from 'http'

const BASE_URL = 'http://localhost:4000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

function request(method: string, path: string, body?: unknown): Promise<{ status: number; data: unknown }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL)
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode ?? 500, data: data ? JSON.parse(data) : null })
        } catch {
          resolve({ status: res.statusCode ?? 500, data })
        }
      })
    })

    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn()
    results.push({ name, passed: true })
    console.log(`✓ ${name}`)
  } catch (error) {
    results.push({ name, passed: false, error: (error as Error).message })
    console.log(`✗ ${name}: ${(error as Error).message}`)
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

async function runTests() {
  console.log('\n=== Basic CRUD API Integration Tests ===\n')

  // Health check
  await test('Health check returns ok', async () => {
    const { status, data } = await request('GET', '/health')
    assert(status === 200, `Expected 200, got ${status}`)
    assert((data as { status: string }).status === 'ok', 'Expected status: ok')
  })

  // User CRUD
  let userId: string

  await test('List users (empty)', async () => {
    const { status, data } = await request('GET', '/api/v1/user')
    assert(status === 200, `Expected 200, got ${status}`)
    assert(Array.isArray((data as { data: unknown[] }).data), 'Expected data array')
  })

  await test('Create user', async () => {
    const { status, data } = await request('POST', '/api/v1/user', {
      name: 'John Doe',
      email: 'john@example.com',
    })
    assert(status === 201, `Expected 201, got ${status}`)
    userId = (data as { id: string }).id
    assert(typeof userId === 'string', 'Expected user id')
    assert((data as { name: string }).name === 'John Doe', 'Expected name: John Doe')
  })

  await test('Get user by ID', async () => {
    const { status, data } = await request('GET', `/api/v1/user/${userId}`)
    assert(status === 200, `Expected 200, got ${status}`)
    assert((data as { name: string }).name === 'John Doe', 'Expected name: John Doe')
  })

  await test('Update user', async () => {
    const { status, data } = await request('PUT', `/api/v1/user/${userId}`, {
      name: 'John Updated',
    })
    assert(status === 200, `Expected 200, got ${status}`)
    assert((data as { name: string }).name === 'John Updated', 'Expected name: John Updated')
  })

  await test('List users (with one user)', async () => {
    const { status, data } = await request('GET', '/api/v1/user')
    assert(status === 200, `Expected 200, got ${status}`)
    assert((data as { data: unknown[] }).data.length === 1, 'Expected 1 user')
  })

  await test('Delete user', async () => {
    const { status } = await request('DELETE', `/api/v1/user/${userId}`)
    assert(status === 204, `Expected 204, got ${status}`)
  })

  await test('Get deleted user returns 404', async () => {
    const { status } = await request('GET', `/api/v1/user/${userId}`)
    assert(status === 404, `Expected 404, got ${status}`)
  })

  // Post CRUD
  let postId: string

  await test('Create post', async () => {
    const { status, data } = await request('POST', '/api/v1/post', {
      title: 'Hello World',
      content: 'This is my first post',
    })
    assert(status === 201, `Expected 201, got ${status}`)
    postId = (data as { id: string }).id
    assert(typeof postId === 'string', 'Expected post id')
  })

  await test('List posts', async () => {
    const { status, data } = await request('GET', '/api/v1/post')
    assert(status === 200, `Expected 200, got ${status}`)
    assert((data as { data: unknown[] }).data.length === 1, 'Expected 1 post')
  })

  await test('Delete post', async () => {
    const { status } = await request('DELETE', `/api/v1/post/${postId}`)
    assert(status === 204, `Expected 204, got ${status}`)
  })

  // Summary
  console.log('\n=== Results ===')
  const passed = results.filter((r) => r.passed).length
  const total = results.length
  console.log(`${passed}/${total} tests passed`)

  if (passed === total) {
    console.log('\n✓ All tests passed!\n')
    process.exit(0)
  } else {
    console.log('\n✗ Some tests failed\n')
    process.exit(1)
  }
}

runTests().catch((err) => {
  console.error('Test runner error:', err)
  process.exit(1)
})
