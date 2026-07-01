import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const searchPaths = [resolve(here, ".."), resolve(here, "../..")];

const eslintPackage = require.resolve("eslint/package.json", { paths: searchPaths });
const eslintBin = join(dirname(eslintPackage), "bin", "eslint.js");
const result = spawnSync(process.execPath, [eslintBin, "."], { stdio: "inherit" });

process.exit(result.status ?? 1);
