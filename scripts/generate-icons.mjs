import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(process.cwd());
const logoSvg = path.join(ROOT, "public", "favicon.svg");
const outDir = path.join(ROOT, "public");

async function ensure() {
  await fs.access(logoSvg).catch(() => {
    throw new Error(`public/favicon.svg not found`);
  });
}

async function generate() {
  await ensure();
  const svg = await fs.readFile(logoSvg);

  const tasks = [
    { name: "web-app-manifest-192x192.png", size: 192 },
    { name: "web-app-manifest-512x512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-96x96.png", size: 96 },
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
