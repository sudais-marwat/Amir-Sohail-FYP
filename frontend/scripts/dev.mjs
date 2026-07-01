import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const searchPaths = [resolve(here, ".."), resolve(here, "../..")];

const vitePackage = require.resolve("vite/package.json", { paths: searchPaths });
const viteBin = join(dirname(vitePackage), "bin", "vite.js");
const args = [viteBin, "--host", "127.0.0.1", "--port", "5173"];
const result = spawnSync(process.execPath, args, { stdio: "inherit" });

process.exit(result.status ?? 1);
