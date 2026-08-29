#!/usr/bin/env node

import { existsSync, lstatSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const modsRoot = join(root, "mods");
const installedRoot = resolve(process.argv[2] || "");
const selectedMod = process.argv[3] || "";
const dryRun = process.argv.includes("--dry-run");

if (!installedRoot || installedRoot === resolve("/") || installedRoot === root) {
  throw new Error(`Refusing unsafe installed-mod path: ${installedRoot || "<empty>"}`);
}

const modNames = selectedMod
  ? [selectedMod]
  : readdirSync(modsRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
      .filter((entry) => !existsSync(join(modsRoot, entry.name, ".deprecated")))
      .map((entry) => entry.name)
      .sort();

for (const modName of modNames) {
  const modDir = join(modsRoot, modName);
  const manifestPath = join(modDir, "modinfo.json");
  if (!existsSync(manifestPath)) continue;

  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (typeof manifest.id !== "string" || manifest.id.length === 0)
    throw new Error(`Invalid modinfo.id in ${manifestPath}`);

  const installedMod = join(installedRoot, manifest.id);
  if (!installedMod.startsWith(`${installedRoot}/`))
    throw new Error(`Refusing installed path outside root: ${installedMod}`);
  if (!existsSync(installedMod)) {
    console.log(`not installed ${manifest.id}`);
    continue;
  }
  if (lstatSync(installedMod).isSymbolicLink())
    throw new Error(`Refusing to remove symlink: ${installedMod}`);

  console.log(`${dryRun ? "would remove" : "removing"} ${installedMod}`);
  if (!dryRun) rmSync(installedMod, { recursive: true, force: true });
}
