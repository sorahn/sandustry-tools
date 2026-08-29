#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  unlinkSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const TEMPLATE = join(ROOT, "resources", "SandustryModTemplate");
const TEMPLATE_DIST = join(TEMPLATE, "dist");
const STAGING_ROOT = join(ROOT, "artifacts", "sandustry-integration");
const STAGING_MODS = join(STAGING_ROOT, "mods");
const targetMod = process.env.SANDUSTRY_MOD ?? "test-blocks";
const modNames = targetMod === "splitter" ? ["test-blocks", "splitter"] : [targetMod];
const modPackages = modNames.map((name) => {
  const dir = join(ROOT, "mods", name);
  const manifest = JSON.parse(readFileSync(join(dir, "modinfo.json"), "utf8"));
  return { name, id: manifest.id, dir, package: join(dir, "build", "package") };
});
const MOD_DIR = join(ROOT, "mods", targetMod);
const visible = process.argv.includes("--view");
if (
  !process.env.CHROME &&
  process.platform === "darwin" &&
  existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
) {
  process.env.CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
}
const { startSandustryTestHost, stopSandustryTestHost } = await import(
  join(TEMPLATE, "modkit", "test", "host.ts")
);

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: ROOT, stdio: "inherit", ...options });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function integrationTests(root) {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (
        entry.name.endsWith(".integration.test.ts") ||
        entry.name.endsWith(".integration.test.tsx")
      ) {
        files.push(path);
      }
    }
  };
  walk(root);
  return files.sort();
}

if (!existsSync(join(TEMPLATE, "node_modules"))) {
  throw new Error("Template dependencies are missing. Run npm run test:integration:setup once.");
}
if (!existsSync(join(TEMPLATE, "sandustry"))) {
  throw new Error("Private game extraction is missing. Run npm run test:integration:setup first.");
}

for (const mod of modPackages) {
  run("make", ["build", `MOD=${mod.name}`]);
  if (!existsSync(join(mod.package, "entry.js"))) {
    throw new Error(`Expected built package at ${mod.package}`);
  }
}

rmSync(STAGING_ROOT, { recursive: true, force: true });
mkdirSync(STAGING_MODS, { recursive: true });
for (const mod of modPackages) {
  cpSync(mod.package, join(STAGING_MODS, mod.id), { recursive: true });
}

const distState = lstatSync(TEMPLATE_DIST);
if (!distState.isSymbolicLink()) {
  throw new Error(`Expected template dist/ to be a symlink, found ${TEMPLATE_DIST}`);
}
const originalDistTarget = readlinkSync(TEMPLATE_DIST);
unlinkSync(TEMPLATE_DIST);
symlinkSync(STAGING_MODS, TEMPLATE_DIST, "dir");

let result = 1;
let hostStarted = false;
try {
  const tests = integrationTests(MOD_DIR);
  if (tests.length === 0) throw new Error(`No integration tests found under ${MOD_DIR}`);
  const host = await startSandustryTestHost({
    modIds: modPackages.map((mod) => mod.id),
    visible,
  });
  if (!host.ok) throw new Error(host.reason);
  hostStarted = true;
  result =
    spawnSync(
      process.execPath,
      ["--import", join(TEMPLATE, "scripts", "test", "register-modkit.js"), "--test", ...tests],
      {
        cwd: ROOT,
        stdio: "inherit",
        env: { ...process.env, SANDUSTRY_TEST_HOST: "1" },
      },
    ).status ?? 1;
} finally {
  if (hostStarted) await stopSandustryTestHost();
  unlinkSync(TEMPLATE_DIST);
  symlinkSync(originalDistTarget, TEMPLATE_DIST, "dir");
  rmSync(STAGING_ROOT, { recursive: true, force: true });
}
process.exit(result);
