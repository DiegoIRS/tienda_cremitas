import { readdir, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import sharp from "sharp";

const sourceDir = "assets/catalogo-web";
const supportedExtensions = new Set([".jpg", ".jpeg", ".png"]);

async function listImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listImages(path);
    return supportedExtensions.has(extname(entry.name).toLowerCase()) ? [path] : [];
  }));
  return files.flat();
}

const images = await listImages(sourceDir);
const results = [];

for (const image of images) {
  const output = image.replace(/\.(jpe?g|png)$/i, ".webp");
  await sharp(image)
    .webp({ quality: 82, effort: 5 })
    .toFile(output);

  const original = await stat(image);
  const converted = await stat(output);
  results.push({
    image,
    output,
    originalKb: Math.round(original.size / 1024),
    webpKb: Math.round(converted.size / 1024)
  });
}

console.table(results);
console.log(`Converted ${results.length} images to WebP.`);
