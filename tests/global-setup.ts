import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtempSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = process.env.TEST_PORT ?? '3199'
let child: ChildProcess
let dir: string

export async function setup() {
  if (!existsSync('.output/server/index.mjs')) throw new Error('Build first: npm run build (npm test does this for you)')
  dir = mkdtempSync(join(tmpdir(), 'skydesk-'))
  child = spawn(process.execPath, ['.output/server/index.mjs'], {
    env: {
      ...process.env, NODE_ENV: 'production', PORT, NITRO_PORT: PORT, HOST: '127.0.0.1', NITRO_HOST: '127.0.0.1',
      DATABASE_FILE: join(dir, 'test.db'), SESSION_SECRET: 'x'.repeat(48), INSECURE_COOKIES: '1',
      TRUST_PROXY: '1', RATE_LIMIT_MAX: '1500', LOGIN_MAX_FAILS: '5', SKYDESK_QUIET: '1'
    },
    stdio: ['ignore', 'inherit', 'inherit']
  })
  const base = `http://127.0.0.1:${PORT}`
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${base}/api/health`)).ok) { process.env.SKYDESK_URL = base; return } } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 200))
  }
  throw new Error('Server did not start')
}

export async function teardown() {
  child?.kill('SIGTERM')
  await new Promise(r => setTimeout(r, 300))
  if (dir) rmSync(dir, { recursive: true, force: true })
}
