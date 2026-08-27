#!/usr/bin/env node

import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const APP_ID = "2764460";
const workshopId = process.argv[2];
const install = process.env.INSTALL === "1";
const steamcmd = process.env.STEAMCMD || "steamcmd";
const steamcmdUser = process.env.STEAMCMD_USER || "sorahn";

if (!/^\d+$/.test(workshopId ?? "")) {
  console.error("Usage: make steamdl ID=<numeric-workshop-id> [INSTALL=1]");
  process.exit(2);
}

const result = spawnSync(
  steamcmd,
  ["+login", steamcmdUser, "+workshop_download_item", APP_ID, workshopId, "+quit"],
  { stdio: "inherit" },
);
if (result.error) {
  console.error(`Could not run ${steamcmd}: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status ?? 1);

const defaultRoot = join(homedir(), "Library/Application Support/Steam/steamapps/workshop/content");
const roots = [
  process.env.STEAMCMD_WORKSHOP_DIR,
  join(defaultRoot, APP_ID),
  join(homedir(), "Steam/steamapps/workshop/content", APP_ID),
].filter(Boolean);
const downloaded = roots.map((root) => join(root, workshopId)).find((path) => existsSync(path));

if (!downloaded) {
  console.error(
    `Downloaded item ${workshopId} was not found. Set STEAMCMD_WORKSHOP_DIR to its workshop content directory.`,
  );
  process.exit(1);
}

console.log(`Downloaded Workshop item ${workshopId} to ${downloaded}`);
if (!install) process.exit(0);

const modsDir =
  process.env.SANDUSTRY_MODS_DIR || join(homedir(), "Library/Application Support/sandustry/mods");
const manifestPath = join(downloaded, "modinfo.json");
if (!existsSync(manifestPath)) {
  console.error(`Workshop item ${workshopId} has no modinfo.json`);
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`Could not read ${manifestPath}: ${error.message}`);
  process.exit(1);
}
if (typeof manifest.id !== "string" || !manifest.id) {
  console.error(`Workshop item ${workshopId} has no valid manifest id`);
  process.exit(1);
}

const installDir = join(modsDir, manifest.id);
mkdirSync(installDir, { recursive: true });
cpSync(downloaded, installDir, { recursive: true, force: true });
console.log(`Installed ${manifest.id} to ${installDir}`);
