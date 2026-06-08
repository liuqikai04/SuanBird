import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const source = path.join(root, "dist", "index.html");
const targetDirs = [
  path.join(root, "Prompt_extraction", "src", "main", "resources", "static"),
  path.join(root, "Prompt_extraction", "target", "classes", "static")
];

for (const targetDir of targetDirs) {
  const target = path.join(targetDir, "index.html");
  await mkdir(targetDir, { recursive: true });
  await copyFile(source, target);

  console.log(`Published ${path.relative(root, target)}`);
}
