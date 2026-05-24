import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const sourceDir = "dist-studio";
const targetDir = "dist/admin";
const targetIndex = join(targetDir, "index.html");

if (!existsSync(sourceDir)) {
  throw new Error(`Missing ${sourceDir}. Run npm run cms:build before embedding the Studio.`);
}

mkdirSync(dirname(targetDir), { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });

if (existsSync(targetIndex)) {
  const html = readFileSync(targetIndex, "utf8").replaceAll("/static/", "/admin/static/");
  writeFileSync(targetIndex, html);
}
