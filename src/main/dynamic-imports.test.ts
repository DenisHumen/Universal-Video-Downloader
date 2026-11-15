import { execFileSync } from 'child_process'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/*
  An `import()` of a package survives the main bundle as a real dynamic import,
  which Node resolves by the ESM rules: a path inside a package needs its
  extension. `node-smb2/dist/client/File` passed every test here, since vitest
  guesses extensions, and failed every share upload in the installed app with
  "Cannot find module ... Did you mean to import node-smb2/dist/client/File.js?".
  So each one is resolved here the way the app will resolve it.
*/

const MAIN = join(__dirname)

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : []
  })
}

function dynamicPackageImports(): string[] {
  const found = new Set<string>()
  for (const file of sources(MAIN)) {
    for (const m of readFileSync(file, 'utf8').matchAll(/\bimport\(\s*['"]([^'"./][^'"]*)['"]\s*\)/g)) {
      // The app's own aliases are bundled; a scheme (`node:`, or `qjs:` quoted in a comment) is no package.
      if (!m[1].startsWith('@shared/') && !/^[a-z]+:/.test(m[1])) found.add(m[1])
    }
  }
  return [...found]
}

describe('dynamic imports in the main process', () => {
  const specifiers = dynamicPackageImports()

  it('finds the ones it is guarding', () => {
    expect(specifiers).toContain('node-smb2/dist/client/File.js')
  })

  it.each(specifiers)('%s resolves the way the installed app resolves it', (specifier) => {
    const script = `await import(${JSON.stringify(specifier)}); console.log('ok')`
    const out = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: join(MAIN, '..', '..'),
      encoding: 'utf8'
    })
    expect(out.trim()).toBe('ok')
  })
})
