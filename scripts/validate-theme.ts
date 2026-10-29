/**
 * Validate a theme zip locally before uploading — same checks as the admin upload.
 *   npm run theme:validate path/to/theme.zip
 */
import { readFileSync } from 'fs'
import { validateThemeZip } from '../src/lib/themes/validate'

const file = process.argv[2]
if (!file) {
  console.error('Usage: npm run theme:validate <theme.zip>')
  process.exit(2)
}

const result = validateThemeZip(new Uint8Array(readFileSync(file)))
const m = result.manifest
if (m) console.log(`\n${m.name} (${m.id}) v${m.version} — ${m.niche}\nfeatures: ${m.features.join(', ')}`)
console.log(`files: ${result.stats.files} (${result.stats.distFiles} in dist/), ${(result.stats.bytes / 1024 / 1024).toFixed(2)} MB`)
for (const w of result.warnings) console.log(`  ⚠ ${w}`)
for (const e of result.errors) console.log(`  ✖ ${e}`)
console.log(result.ok ? '\n✔ Theme is valid and ready to upload\n' : `\n✖ ${result.errors.length} error(s) — fix them and try again\n`)
process.exit(result.ok ? 0 : 1)
