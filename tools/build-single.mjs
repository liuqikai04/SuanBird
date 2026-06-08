import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const distDir = path.join(root, "dist");
const assetsDir = path.join(distDir, "assets");
const htmlPath = path.join(distDir, "index.html");
const outputPath = path.join(distDir, "index.single.html");

const mimeByExt = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

async function readAssets() {
  const entries = await readdir(assetsDir, { withFileTypes: true }).catch(() => []);
  const assets = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const filePath = path.join(assetsDir, entry.name);
    const ext = path.extname(entry.name);

    if (ext === ".js" || ext === ".css") {
      assets.set(`/assets/${entry.name}`, await readFile(filePath, "utf8"));
      assets.set(`./assets/${entry.name}`, assets.get(`/assets/${entry.name}`));
      continue;
    }

    const mime = mimeByExt[ext];
    if (mime) {
      const bytes = await readFile(filePath);
      const dataUrl = `data:${mime};base64,${bytes.toString("base64")}`;
      assets.set(`/assets/${entry.name}`, dataUrl);
      assets.set(`./assets/${entry.name}`, dataUrl);
    }
  }

  return assets;
}

function inlineReferences(html, assets) {
  let output = html;

  output = output.replace(
    /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
    (_, src) => `<script type="module">\n${assets.get(src) ?? ""}\n</script>`
  );

  output = output.replace(
    /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
    (_, href) => `<style>\n${assets.get(href) ?? ""}\n</style>`
  );

  for (const [ref, value] of assets.entries()) {
    if (value.startsWith("data:")) {
      output = output.split(ref).join(value);
    }
  }

  return output;
}

await mkdir(distDir, { recursive: true });
const html = await readFile(htmlPath, "utf8");
const assets = await readAssets();
await writeFile(outputPath, inlineReferences(html, assets), "utf8");

console.log(`Created ${path.relative(root, outputPath)}`);
