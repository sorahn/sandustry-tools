#!/usr/bin/env node

import { existsSync, mkdirSync, symlinkSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolveSandustryAsar, resolveSandustryBinary } from "../dev/sandustry-paths.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TEMPLATE = join(ROOT, "packages", "sandustry-mod-template");
const SHIM_ROOT = join(ROOT, "artifacts", "sandustry-template-host");
const SHIM_BINARY = join(SHIM_ROOT, "bin", "sandustry");
const SHIM_ASAR = join(SHIM_ROOT, "bin", "resources", "app.asar");

function replaceLink(path, target) {
  try {
    unlinkSync(path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  symlinkSync(target, path);
}

const binary = process.env.SANDUSTRY?.trim() || resolveSandustryBinary();
const asar = process.env.SANDUSTRY_ASAR?.trim() || resolveSandustryAsar();
if (!existsSync(binary)) throw new Error(`Sandustry binary not found: ${binary}`);
if (!existsSync(asar)) throw new Error(`Sandustry ASAR not found: ${asar}`);

mkdirSync(join(SHIM_ROOT, "bin", "resources"), { recursive: true });
replaceLink(SHIM_BINARY, binary);
replaceLink(SHIM_ASAR, asar);

const result = spawnSync("npm", ["run", "setup"], {
  cwd: TEMPLATE,
  stdio: "inherit",
  env: { ...process.env, SANDUSTRY: SHIM_BINARY },
});
process.exit(result.status ?? 1);
