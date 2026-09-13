#!/usr/bin/env node
/**
 * Copies legacy Inertia pages into app feature folders as SPA placeholders.
 * Run: node scripts/port-legacy-pages.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const legacyPages = path.join(root, 'legacy.downstreamx/resources/js/pages')
const legacyWorkdo = path.join(root, 'legacy.downstreamx/packages/workdo')
const target = path.join(root, 'app.downstreamx/src/features')

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (entry.name.endsWith('.tsx')) out.push(p)
  }
  return out
}

let count = 0
for (const file of walk(legacyPages)) {
  const rel = path.relative(legacyPages, file)
  const dest = path.join(target, rel.toLowerCase().replace(/\\/g, '/'))
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  if (!fs.existsSync(dest)) {
    let content = fs.readFileSync(file, 'utf8')
    content = `/** Ported from legacy — replace Inertia with TanStack Query + RHF */\n// TODO: migrate\nexport default function Placeholder() { return <div>${rel}</motion.div> }\n`
    fs.writeFileSync(dest, content)
    count++
  }
}

for (const mod of fs.readdirSync(legacyWorkdo)) {
  const pagesDir = path.join(legacyWorkdo, mod, 'src/Resources/js/Pages')
  for (const file of walk(pagesDir)) {
    const rel = path.relative(pagesDir, file)
    const dest = path.join(target, mod.toLowerCase(), 'pages', rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(
        dest,
        `/** Ported from Workdo/${mod} */\nexport default function Placeholder() { return <div>${mod}/${rel}</motion.div> }\n`,
      )
      count++
    }
  }
}

console.log(`Created ${count} SPA page placeholders`)
