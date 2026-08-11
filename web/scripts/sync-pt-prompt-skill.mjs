import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = resolve(projectRoot, "skills/the-factory-pt-prompt/SKILL.md");
const targetPath = resolve(projectRoot, "public/the-factory-pt-prompt-skill.md");

const skill = await readFile(sourcePath, "utf8");
await mkdir(dirname(targetPath), { recursive: true });
await writeFile(targetPath, skill, "utf8");
console.log(`Synced ${sourcePath} to ${targetPath}`);
