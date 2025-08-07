import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const logoSvg = path.join(ROOT, "public", "logo.svg");
const outDir = path.join(ROOT, "public");

async function ensure() {
  await fs.access(logoSvg).catch(() => {
    throw new Error(`public/logo.svg not found`);
  });
}

async function generate() {
  await ensure();
  const svg = await fs.readFile(logoSvg);

  const tasks = [
    { name: "icon-192x192.png", size: 192 },
    { name: "icon-512x512.png", size: 512 },
    { name: "favicon-32x32.png", size: 32 },
    { name: "favicon-16x16.png", size: 16 },
  ];

  for (const t of tasks) {
    const out = path.join(outDir, t.name);
    const img = await sharp(svg)
      .resize(t.size, t.size, {
        fit: "contain",
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png();
    await img.toFile(out);
    console.log("generated", t.name);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
