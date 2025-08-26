#!/usr/bin/env node
// Optimize images in /public by recompressing JPEG/PNG in place when smaller
// Usage: pnpm images:optimize

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const PUBLIC_DIR = path.join(ROOT, "public");

const INCLUDE_EXT = new Set([".jpg", ".jpeg", ".png"]);
const EXCLUDE_NAMES = new Set([
  // Do not touch icons/manifest assets or service worker
  "manifest.json",
  "sw.js",
  "ads.txt",
]);

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath);
  if (!INCLUDE_EXT.has(ext) || EXCLUDE_NAMES.has(base))
    return { skipped: true };

  const input = await fs.readFile(filePath);
  const inputSize = input.length;

  let outputBuffer;
  if (ext === ".jpg" || ext === ".jpeg") {
    outputBuffer = await sharp(input)
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
  } else if (ext === ".png") {
    // palette:true can reduce size notably for many assets
    outputBuffer = await sharp(input)
      .png({ compressionLevel: 9, palette: true })
      .toBuffer();
  }

  if (!outputBuffer) return { skipped: true };

  if (outputBuffer.length < inputSize) {
    await fs.writeFile(filePath, outputBuffer);
    return {
      optimized: true,
      saved: inputSize - outputBuffer.length,
      before: inputSize,
      after: outputBuffer.length,
    };
  }
  return { optimized: false };
}

async function main() {
  let files = 0;
  let optimized = 0;
  let bytesSaved = 0;

  for await (const file of walk(PUBLIC_DIR)) {
    const res = await optimizeFile(file);
    if (res.skipped) continue;
    files += 1;
    if (res.optimized) {
      optimized += 1;
      bytesSaved += res.saved;
      // eslint-disable-next-line no-console
      console.log(
        `Optimized: ${path.relative(PUBLIC_DIR, file)} (-${Math.round(
          res.saved / 1024
        )} KB)`
      );
    }
  }

  // eslint-disable-next-line no-console
  console.log(
    `Processed ${files} images. Optimized ${optimized}. Saved ~${Math.round(
      bytesSaved / 1024
    )} KB.`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
