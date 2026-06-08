import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const srcDir = path.join(root, "src");
const distDir = path.join(root, "dist");
const entry = path.join(srcDir, "main.js");

const cssFiles = [
  "src/styles/base.css",
  "src/styles/layout.css",
  "src/styles/components.css",
  "src/styles/card.css"
];

const seen = new Set();
const moduleChunks = [];

async function build() {
  await walkModule(entry);

  const styles = await Promise.all(
    cssFiles.map((file) => readFile(path.join(root, file), "utf8"))
  );

  const html = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#f7f3ea" />
    <title>笑一下蒜鸟</title>
    <style>
${styles.join("\n\n")}
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script>
${moduleChunks.join("\n\n")}
    </script>
  </body>
</html>
`;

  await mkdir(distDir, { recursive: true });
  await writeFile(path.join(distDir, "index.html"), html, "utf8");
  console.log("Created dist/index.html");
}

async function walkModule(filePath) {
  const normalized = path.normalize(filePath);
  if (seen.has(normalized)) return;
  seen.add(normalized);

  const source = await readFile(normalized, "utf8");
  const imports = [...source.matchAll(/import\s+[^'"]*['"](.+?)['"];?/g)];

  for (const match of imports) {
    const specifier = match[1];
    if (!specifier.startsWith(".")) continue;

    const resolved = resolveImport(normalized, specifier);
    await walkModule(resolved);
  }

  moduleChunks.push(await transformModule(source, normalized));
}

function resolveImport(fromFile, specifier) {
  const base = path.dirname(fromFile);
  const resolved = path.resolve(base, specifier);
  return path.extname(resolved) ? resolved : `${resolved}.js`;
}

async function transformModule(source, filePath) {
  let output = source
    .replace(/import\s+[^'"]*['"].+?['"];?\n?/g, "")
    .replace(/export\s+async\s+function\s+/g, "async function ")
    .replace(/export\s+function\s+/g, "function ")
    .replace(/export\s+const\s+/g, "const ")
    .replace(/export\s+let\s+/g, "let ")
    .replace(/export\s+class\s+/g, "class ");

  output = await inlineAssetUrls(output, filePath);

  return `// ${path.relative(root, filePath).replaceAll("\\", "/")}\n${output}`;
}

async function inlineAssetUrls(source, filePath) {
  const assetPattern =
    /new URL\(["'](.+?)["'],\s*import\.meta\.url\)\.href/g;
  let output = source;
  const matches = [...source.matchAll(assetPattern)];

  for (const match of matches) {
    const assetPath = path.resolve(path.dirname(filePath), match[1]);
    const dataUrl = await fileToDataUrl(assetPath);
    output = output.replace(match[0], JSON.stringify(dataUrl));
  }

  return output;
}

async function fileToDataUrl(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    {
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp"
    }[ext] || "application/octet-stream";
  const bytes = await readFile(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
