import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "skills/banner-fitness-pt-prompt/SKILL.md");
const targetPaths = [resolve(projectRoot, "public/banner-fitness-pt-prompt-skill.md")];

const skill = await readFile(sourcePath, "utf8");
await Promise.all(targetPaths.map(async (targetPath) => {
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, skill, "utf8");
}));
console.log(`Synced ${sourcePath} to ${targetPaths.join(" and ")}`);
