#!/usr/bin/env node
// check-rename.mjs — completeness gate for the pivi→yapi rebrand.
//
// Scans the tree for stray pivi/Pivi/PIVI/@pivi/ tokens that survived outside
// the rename map's allowlist (file_globs + token_contexts) and fails on any.
// The engine tokens pi/Pi (PiAgent, engine/pi, @earendil-works/pi-*) are not
// "pivi" and are never matched. See scripts/rename-map.json for the allowlist.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isAllowlisted,
  isBinary,
  isTextFile,
  listTrackedFiles,
  loadMap,
  matchGlob,
} from './apply-rename.mjs';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const TOKEN_RE = /pivi|Pivi|PIVI/g;

// Display-leak guard: exact quoted "Yapi"/'Yapi' literals are display surfaces
// that apply-rename Pass 2 does NOT auto-transform (a blanket Yapi->YaPi would
// corrupt code identifiers like YapiPluginHost that share the file). They must
// be "YaPi". Catches eslint.config.mjs brands/ignoreWords regressions and
// hardcoded UI string literals. Backtick-quoted `Yapi` (inline code) is spared.
// See scripts/rename-map.json display_surfaces.manual_display_surfaces.
const DISPLAY_LEAK_RE = /(['"])Yapi\1/g;

// Mask allowlisted token_contexts in a line, then return surviving pivi matches.
export function scanTextForStrayTokens(text, tokenContexts = []) {
  const sorted = [...tokenContexts].sort((a, b) => b.length - a.length);
  const findings = [];
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    let line = lines[lineNo];
    for (const ctx of sorted) {
      if (!ctx) continue;
      line = line.split(ctx).join('\u0000'.repeat(ctx.length));
    }
    let m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(line)) !== null) {
      findings.push({ line: lineNo + 1, col: m.index + 1, token: m[0] });
    }
  }
  return findings;
}

// Scan for display-leak quoted "Yapi"/'Yapi' literals (must be "YaPi").
export function scanTextForDisplayLeaks(text) {
  const findings = [];
  const lines = text.split('\n');
  for (let lineNo = 0; lineNo < lines.length; lineNo += 1) {
    const line = lines[lineNo];
    DISPLAY_LEAK_RE.lastIndex = 0;
    let m;
    while ((m = DISPLAY_LEAK_RE.exec(line)) !== null) {
      findings.push({ line: lineNo + 1, col: m.index + 1, token: m[0] });
    }
  }
  return findings;
}

function main() {
  const map = loadMap();
  const tokenContexts = map.allowlist?.token_contexts ?? [];
  const fileGlobs = map.allowlist?.file_globs ?? [];
  const fileTokenContexts = map.allowlist?.file_token_contexts ?? {};

  function contextsFor(relPath) {
    const extra = [];
    for (const [glob, ctxs] of Object.entries(fileTokenContexts)) {
      if (matchGlob(glob, relPath)) extra.push(...(ctxs ?? []));
    }
    return [...tokenContexts, ...extra];
  }

  const failures = [];
  let scanned = 0;
  let pathsScanned = 0;
  for (const relPath of listTrackedFiles()) {
    // Path-level scan: a pivi/Pivi/PIVI component in a non-allowlisted path is a
    // structural rename miss (apply-rename only git-mv's explicit rename-map
    // entries; there is no auto-discovery). Content scanning alone misses these.
    if (!isAllowlisted(relPath, fileGlobs)) {
      pathsScanned += 1;
      const pathStray = scanTextForStrayTokens(relPath, contextsFor(relPath));
      if (pathStray.length) {
        failures.push({ file: relPath, findings: pathStray, kind: 'stray-pivi-path' });
      }
    }
    if (isAllowlisted(relPath, fileGlobs)) continue;
    if (!isTextFile(relPath)) continue;
    const fp = path.join(rootDir, relPath);
    if (isBinary(fp)) continue;
    scanned += 1;
    const text = fs.readFileSync(fp, 'utf8');
    const stray = scanTextForStrayTokens(text, contextsFor(relPath));
    if (stray.length) {
      failures.push({ file: relPath, findings: stray, kind: 'stray-pivi' });
    }
    const leaks = scanTextForDisplayLeaks(text);
    if (leaks.length) {
      failures.push({ file: relPath, findings: leaks, kind: 'display-leak' });
    }
  }

  if (failures.length === 0) {
    console.log(`check-rename passed: no stray pivi/Pivi/PIVI tokens and no display-leak Yapi literals found (${scanned} files, ${pathsScanned} paths scanned).`);
    return;
  }

  const total = failures.reduce((n, f) => n + f.findings.length, 0);
  console.error(`check-rename FAILED: ${total} token(s) in ${failures.length} file(s).`);
  console.error('stray-pivi: if legitimate, add to scripts/rename-map.json allowlist; otherwise rename. stray-pivi-path: a path component still holds pivi/Pivi/PIVI; add a structural_renames entry (or allowlist). display-leak: quoted "Yapi" must be "YaPi" (Pass 2 does not auto-fix; see rename-map.json display_surfaces.manual_display_surfaces).\n');
  for (const { file, findings, kind } of failures) {
    for (const f of findings) {
      console.error(`  [${kind}] ${file}:${f.line}:${f.col}: ${f.token}`);
    }
  }
  process.exit(1);
}

const isMain = path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main();
}
