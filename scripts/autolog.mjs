#!/usr/bin/env node
// Simple autolog for AGENTS.md
// Usage:
//   node scripts/autolog.mjs <major|mid|minor> "Description of change"
// Or via npm scripts: npm run autolog:major -- "Description"

import fs from 'node:fs';
import path from 'node:path';

const levels = new Set(['major','mid','minor']);
const levelArg = (process.argv[2] || '').toLowerCase();
const msg = (process.argv.slice(3).join(' ') || '').trim();

if (!levels.has(levelArg) || !msg) {
  console.error('Usage: node scripts/autolog.mjs <major|mid|minor> "Description"');
  process.exit(1);
}

const badges = {
  major: '[MAJOR]',
  mid: '[MID]',
  minor: '[MINOR]',
};

const root = process.cwd();
const file = path.join(root, 'UPDATES.md');

const now = new Date();
const dateStr = now.toISOString().slice(0,10); // YYYY-MM-DD
const entry = `- ${badges[levelArg]}: ${msg} — ${dateStr}`;

let contents = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';

const startMarker = '<!-- AUTOLOG:START -->';
const endMarker = '<!-- AUTOLOG:END -->';

if (!contents.includes(startMarker) || !contents.includes(endMarker)) {
  // Create base file with section
  const header = `# Project Updates Log\n\nThis file is maintained automatically by scripts/autolog.mjs.\n\n## Entries\n\n${startMarker}\n${endMarker}\n`;
  contents = header;
}

// Insert entry at top of block (after START)
const startIdx = contents.indexOf(startMarker);
const endIdx = contents.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
  console.error('AUTOLOG markers malformed');
  process.exit(1);
}

const before = contents.slice(0, startIdx + startMarker.length);
const block = contents.slice(startIdx + startMarker.length, endIdx);
const after = contents.slice(endIdx);

const trimmed = block.replace(/^\n+/, '');
const newBlock = `\n${entry}\n${trimmed}`.replace(/\n{3,}/g, '\n\n');
const updated = `${before}${newBlock}${after}`;

fs.writeFileSync(file, updated, 'utf8');
console.log(`Logged to UPDATES.md: ${badges[levelArg]} ${msg}`);
