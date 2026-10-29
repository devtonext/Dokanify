// Builds the upload zip that follows the NexDrop Theme Spec:
//   theme.json, schema/, defaults/, preview/, dist/, source/
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { zipSync } from 'fflate'

const root = new URL('..', import.meta.url).pathname
const manifest = JSON.parse(readFileSync(join(root, 'theme.json'), 'utf8'))
const files = {}

function add(dir, prefix = '', filter = () => true) {
  const abs = join(root, dir)
  if (!existsSync(abs)) return
  for (const name of readdirSync(abs)) {
    if (name === 'node_modules' || name.startsWith('.')) continue
    const path = join(abs, name)
    if (statSync(path).isDirectory()) add(join(dir, name), prefix, filter)
    else if (filter(path)) files[prefix + relative(root, path)] = new Uint8Array(readFileSync(path))
  }
}

files['theme.json'] = new Uint8Array(readFileSync(join(root, 'theme.json')))
add('schema')
add('defaults')
add('preview')
add('dist')
// Source for marketplace buyers
for (const f of ['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'theme.json']) {
  files[`source/${f}`] = new Uint8Array(readFileSync(join(root, f)))
}
add('src', 'source/')
add('public', 'source/')
add('scripts', 'source/')

const out = join(root, `${manifest.id}-${manifest.version}.zip`)
writeFileSync(out, zipSync(files, { level: 9 }))
console.log(`✔ ${relative(process.cwd(), out)} (${Object.keys(files).length} files)`)
