#!/usr/bin/env node
// apply-rename.mjs — applies the pivi→yapi rebrand from scripts/rename-map.json.
//
// Pass 1 (uniform): pivi→yapi, Pivi→Yapi, PIVI→YAPI in all text files, with
//   allowlisted token_contexts (upstream attribution) masked so they survive.
// Pass 2 (display): Yapi→YaPi in display surfaces only — i18n JSON string
//   values, manifest/package description+name fields, and markdown prose
//   (fenced/inline code is spared).
// Structural renames: git mv the paths listed in rename-map.json
//   (directories shallowest-first, then files).
//
// The engine tokens pi/Pi (PiAgent, engine/pi, @earendil-works/pi-agent-core)
// are never matched — Pass 1 targets the full 4-character tokens pivi/Pivi/PIVI.
//
// Idempotent: re-running on an already-renamed tree is a no-op. Kept in the
// repository for auditability and re-runs. NOT run automatically by any gate.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mapPath = path.join(rootDir, 'scripts', 'rename-map.json');

export function loadMap() {
  return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
}

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.json5', '.md',
  '.mdc', '.jsonl', '.css', '.html', '.htm', '.svg', '.xml', '.yml', '.yaml', '.sh',
  '.bash', '.txt', '.env', '.example', '.gitignore', '.npmrc', '.toml',
  '.lock', '.editorconfig', '.properties',
]);

const SKIP_FILES = new Set([
  'main.js', 'styles.css', 'package-lock.json', 'metafile.json', 'metafile-main.js',
]);

// --- glob matching (minimal: supports ** and *) ---
export function matchGlob(pattern, relPath) {
  let re = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*' && pattern[i + 1] === '*') {
      re += '.*';
      i += 2;
      if (pattern[i] === '/') i += 1; // **/ -> .*/ (slash consumed)
    } else if (ch === '*') {
      re += '[^/]*';
      i += 1;
    } else if ('.+?^${}()|[]\\'.includes(ch)) {
      re += '\\' + ch;
      i += 1;
    } else {
      re += ch;
      i += 1;
    }
  }
  return new RegExp('^(?:' + re + ')$').test(relPath);
}

export function isAllowlisted(relPath, fileGlobs) {
  return (fileGlobs ?? []).some((g) => matchGlob(g, relPath));
}

// --- Pass 1: uniform token replacement with token_context protection ---
export function applyPass1(text, tokenContexts = []) {
  // Mask allowlisted token_contexts (longest first) so attribution like
  // shuuul/obsidian-pivi survives the uniform pivi→yapi replacement.
  const sorted = [...tokenContexts].sort((a, b) => b.length - a.length);
  const placeholders = [];
  let masked = text;
  for (const ctx of sorted) {
    if (!ctx) continue;
    const idx = placeholders.length;
    const ph = `\u0000CTX${idx}\u0000`;
    masked = masked.split(ctx).join(ph);
    placeholders.push(ctx);
  }
  masked = masked.replace(/pivi/g, 'yapi').replace(/Pivi/g, 'Yapi').replace(/PIVI/g, 'YAPI');
  let out = masked;
  placeholders.forEach((ctx, idx) => {
    out = out.split(`\u0000CTX${idx}\u0000`).join(ctx);
  });
  return out;
}

// --- Pass 2: markdown prose Yapi→YaPi (spares fenced + inline code) ---
function transformInlineCode(line, fn) {
  const parts = line.split('`');
  for (let i = 0; i < parts.length; i += 2) parts[i] = fn(parts[i]);
  return parts.join('`');
}

export function applyPass2MarkdownProse(text) {
  const lines = text.split('\n');
  let inFence = false;
  return lines
    .map((line) => {
      if (/^\s*```/.test(line)) {
        inFence = !inFence;
        return line;
      }
      if (inFence) return line;
      return transformInlineCode(line, (seg) => seg.replace(/Yapi/g, 'YaPi'));
    })
    .join('\n');
}

// --- Pass 2: JSON string values Yapi→YaPi (keys spared) ---
export function transformJsonValue(obj) {
  if (typeof obj === 'string') return obj.replace(/Yapi/g, 'YaPi');
  if (Array.isArray(obj)) return obj.map(transformJsonValue);
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) out[k] = transformJsonValue(v);
    return out;
  }
  return obj;
}

// Serialize JSON with 2-space indent, raw (unescaped) non-ASCII, trailing newline.
// Round-trips the existing locale files byte-for-byte when no values change.
export function stringifyLocale(obj) {
  const s = JSON.stringify(obj, null, 2).replace(
    /\\u([0-9a-fA-F]{4})/g,
    (_m, hex) => String.fromCharCode(parseInt(hex, 16)),
  );
  return s + '\n';
}

// --- file enumeration: git-tracked text files only (verifies committed source) ---
// Walking the filesystem would pick up untracked runtime/tooling dirs
// (.pi, .gjc, .yapi/sessions, ...). Using `git ls-files` scopes the rename and
// the completeness check to the committed source tree. Shared with check-rename
// so the gate scans exactly the surface the generator renames.
export function listTrackedFiles() {
  const out = execFileSync('git', ['ls-files'], { cwd: rootDir, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

export function isTextFile(relPath) {
  if (SKIP_FILES.has(path.basename(relPath))) return false;
  const ext = path.extname(relPath);
  if (TEXT_EXTENSIONS.has(ext)) return true;
  // extensionless config files like .gitignore, .npmrc, .env.local.example
  const base = path.basename(relPath);
  if (['.gitignore', '.npmrc', '.editorconfig'].includes(base)) return true;
  return false;
}

export function isBinary(fp) {
  const fd = fs.openSync(fp, 'r');
  try {
    const buf = Buffer.alloc(8000);
    const n = fs.readSync(fd, buf, 0, 8000, 0);
    return buf.subarray(0, n).includes(0);
  } finally {
    fs.closeSync(fd);
  }
}

function gitMv(from, to) {
  const fromAbs = path.join(rootDir, from);
  const toAbs = path.join(rootDir, to);
  if (!fs.existsSync(fromAbs)) return false; // already renamed
  if (fs.existsSync(toAbs)) return false; // target exists
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  execFileSync('git', ['mv', from, to], { cwd: rootDir, stdio: 'pipe' });
  return true;
}

function isDisplayMarkdown(relPath, globs) {
  return globs.some((g) => matchGlob(g, relPath));
}

// --- main ---
function main() {
  const map = loadMap();
  const tokenContexts = map.allowlist?.token_contexts ?? [];
  const fileGlobs = map.allowlist?.file_globs ?? [];
  const dryRun = process.argv.includes('--dry-run');

  // 1. Structural renames: directories first (shallowest), then files.
  let dirRenames = 0;
  let fileRenames = 0;
  for (const { from, to } of map.structural_renames?.directories ?? []) {
    if (dryRun) {
      if (fs.existsSync(path.join(rootDir, from))) console.log(`[dry-run] git mv ${from} -> ${to}`);
      continue;
    }
    if (gitMv(from, to)) dirRenames += 1;
  }
  for (const { from, to } of map.structural_renames?.files ?? []) {
    if (dryRun) {
      if (fs.existsSync(path.join(rootDir, from))) console.log(`[dry-run] git mv ${from} -> ${to}`);
      continue;
    }
    if (gitMv(from, to)) fileRenames += 1;
  }

  // 2. Content Pass 1 (uniform) + Pass 2 (display) on all tracked text files.
  const ds = map.display_surfaces ?? {};
  let pass1 = 0;
  let pass2 = 0;
  for (const relPath of listTrackedFiles()) {
    if (isAllowlisted(relPath, fileGlobs)) continue;
    if (!isTextFile(relPath)) continue;
    const fp = path.join(rootDir, relPath);
    if (isBinary(fp)) continue;

    const original = fs.readFileSync(fp, 'utf8');

    // Pass 1: uniform token replacement.
    let next = applyPass1(original, tokenContexts);

    // Pass 2: display wordmark on specific surfaces.
    const isLocale = matchGlob(ds.json_value_glob ?? '', relPath);
    const isManifest = relPath === 'manifest.json';
    const isPackage = relPath === 'package.json';
    const isMd = isDisplayMarkdown(relPath, ds.markdown_prose_globs ?? []);

    if (isLocale) {
      const obj = JSON.parse(next);
      const transformed = transformJsonValue(obj);
      next = stringifyLocale(transformed);
      if (next !== original) pass2 += 1;
    } else if (isManifest || isPackage) {
      const fields = isManifest ? ds.json_value_fields?.['manifest.json'] : ds.json_value_fields?.['package.json'];
      if (fields?.length) {
        const obj = JSON.parse(next);
        for (const f of fields) {
          if (typeof obj[f] === 'string') obj[f] = obj[f].replace(/Yapi/g, 'YaPi');
        }
        next = JSON.stringify(obj, null, 2) + '\n';
      }
    } else if (isMd) {
      const before = next;
      next = applyPass2MarkdownProse(next);
      if (next !== before) pass2 += 1;
    }

    if (next !== original) {
      pass1 += 1;
      if (!dryRun) fs.writeFileSync(fp, next);
    }
  }

  console.log(
    `apply-rename ${dryRun ? '(dry-run) ' : ''}done: ` +
      `${dirRenames} dir rename(s), ${fileRenames} file rename(s), ` +
      `${pass1} file(s) with content changes (${pass2} with display wordmark).`,
  );
  if (!dryRun) {
    console.log('Re-run `npm install` to regenerate package-lock.json, then verify with:');
    console.log('  npm run typecheck && npm run lint && npm run check:boundaries && npm run check:rename && npm run test:coverage && npm run build');
  }
}

const isMain = path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main();
}
