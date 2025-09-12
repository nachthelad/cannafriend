#!/usr/bin/env node
// Bumps package.json version according to level
// Usage: node scripts/autoversion.mjs <major|mid|minor>

import fs from 'node:fs';
import path from 'node:path';

const levels = new Set(['major','mid','minor']);
const levelArg = (process.argv[2] || '').toLowerCase();
if (!levels.has(levelArg)) {
  console.error('Usage: node scripts/autoversion.mjs <major|mid|minor>');
  process.exit(1);
}

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
let [major, minor, patch] = (pkg.version || '0.0.0').split('.').map((n) => parseInt(n, 10) || 0);

if (levelArg === 'major') {
  major += 1; minor = 0; patch = 0;
} else if (levelArg === 'mid') {
  minor += 1; patch = 0;
} else {
  patch += 1;
}

pkg.version = `${major}.${minor}.${patch}`;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(`Version bumped to ${pkg.version}`);

