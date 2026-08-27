#!/usr/bin/env node

import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { homedir, tmpdir } from "node:os";

const [modDirArgument, contentDirArgument] = process.argv.slice(2);
if (!modDirArgument || !contentDirArgument) {
  console.error("Usage: publish-workshop.mjs <mod-dir> <content-dir>");
  process.exit(2);
}

const root = resolve(import.meta.dirname, "..");
const modDir = resolve(modDirArgument);
const contentDir = resolve(contentDirArgument);
const manifest = readJson(join(modDir, "modinfo.json"));
const descriptionPath = join(modDir, "description.txt");
if (existsSync(descriptionPath))
  manifest.description = readFileSync(descriptionPath, "utf8").trim();
const registryPath = join(root, "workshop-published-ids.json");
const registry = readJson(registryPath);
const recordedPublishedFileId = registry[manifest.id];

if (
  recordedPublishedFileId != null &&
  (!/^\d+$/.test(String(recordedPublishedFileId)) || Number(recordedPublishedFileId) === 0)
) {
  console.error(`Invalid published Workshop ID for ${manifest.id}: ${recordedPublishedFileId}`);
  process.exit(1);
}

if (!existsSync(contentDir)) {
  console.error(`Workshop content directory does not exist: ${contentDir}`);
  process.exit(1);
}

const appId = process.env.STEAM_APP_ID ?? "2764460";
const steamcmd = process.env.STEAMCMD ?? "steamcmd";
const steamAccount = process.env.STEAM_ACCOUNT ?? findSteamAccount();
const changenote = formatChangenote(process.env.CHANGE_NOTE ?? readChangelogNote(modDir, manifest));
const previewPath = ["preview.png", "preview.gif", "preview.jpg", "preview.jpeg"]
  .map((name) => join(modDir, name))
  .find((path) => existsSync(path));
const tempDir = mkdtempSync(join(tmpdir(), "sandustry-workshop-"));
const vdfPath = join(tempDir, "workshop-item.vdf");

const fields = [
  ["appid", appId],
  ["contentfolder", contentDir],
  ["title", manifest.name],
  ["description", manifest.description ?? ""],
  ["changenote", changenote],
];
if (recordedPublishedFileId != null) {
  fields.splice(1, 0, ["publishedfileid", String(recordedPublishedFileId)]);
}
if (previewPath) fields.push(["previewfile", previewPath]);

const vdf = [
  '"workshopitem"',
  "{",
  ...fields.map(([key, value]) => `  "${key}" "${escapeVdf(value)}"`),
  "}",
  "",
].join("\n");

writeFileSync(vdfPath, vdf);
console.log(
  recordedPublishedFileId == null
    ? `Creating Workshop item for ${manifest.name} v${manifest.version}`
    : `Publishing ${manifest.name} v${manifest.version} (${recordedPublishedFileId})`,
);
console.log(`Workshop changenote: ${changenote}`);

try {
  const result = spawnSync(
    steamcmd,
    ["+login", steamAccount, "+workshop_build_item", vdfPath, "+quit"],
    {
      stdio: "inherit",
    },
  );
  if (result.error) {
    console.error(`Could not run ${steamcmd}: ${result.error.message}`);
    process.exitCode = 1;
  } else if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }

  if (!process.exitCode && recordedPublishedFileId == null) {
    const newPublishedFileId = readVdfValue(vdfPath, "publishedfileid");
    if (
      !newPublishedFileId ||
      !/^\d+$/.test(newPublishedFileId) ||
      Number(newPublishedFileId) === 0
    ) {
      console.error("SteamCMD completed without writing a published Workshop ID to the VDF.");
      process.exitCode = 1;
    } else {
      registry[manifest.id] = newPublishedFileId;
      writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
      console.log(`Recorded ${manifest.id} publishedFileId=${newPublishedFileId}`);
    }
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}

if (process.exitCode) process.exit(process.exitCode);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`Could not read ${path}: ${error.message}`);
    process.exit(1);
  }
}

function readChangelogNote(modDir, manifest) {
  const changelogPath = join(modDir, "CHANGELOG.md");
  if (!existsSync(changelogPath)) return `Update ${manifest.name} to v${manifest.version}`;
  const changelog = readFileSync(changelogPath, "utf8");
  const escapedVersion = manifest.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = changelog.match(new RegExp(`^##\\s+v?${escapedVersion}\\s*$`, "mi"));
  const sectionStart = heading ? (heading.index ?? 0) + heading[0].length : -1;
  const remainder = sectionStart < 0 ? "" : changelog.slice(sectionStart);
  const nextHeading = remainder.search(/^##\\s+/m);
  const note = remainder.slice(0, nextHeading < 0 ? remainder.length : nextHeading).trim();
  if (note) return note;
  console.warn(
    `No CHANGELOG.md entry for ${manifest.name} v${manifest.version}; using default note.`,
  );
  return `Update ${manifest.name} to v${manifest.version}`;
}

function formatChangenote(value) {
  return String(value)
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s+/, "• "))
    .join("\n");
}

function escapeVdf(value) {
  return String(value).replaceAll("\r\n", "\n").replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function readVdfValue(path, key) {
  const contents = readFileSync(path, "utf8");
  const match = contents.match(new RegExp(`"${key}"\\s+"([^"\\r\\n]+)"`));
  return match?.[1] ?? null;
}

function findSteamAccount() {
  for (const root of steamRoots()) {
    const loginUsersPath = join(root, "config", "loginusers.vdf");
    if (!existsSync(loginUsersPath)) continue;
    const account = mostRecentSteamAccount(readFileSync(loginUsersPath, "utf8"));
    if (account) return account;
  }

  console.error("Could not find a Steam account in loginusers.vdf.");
  console.error("Set STEAM_ACCOUNT=<account name> or log into the Steam client first.");
  process.exit(1);
}

function steamRoots() {
  if (process.env.STEAM_ROOT) return [process.env.STEAM_ROOT];
  if (process.platform === "darwin") return [join(homedir(), "Library/Application Support/Steam")];
  if (process.platform === "win32") {
    return [
      process.env["ProgramFiles(x86)"] && join(process.env["ProgramFiles(x86)"], "Steam"),
      process.env.ProgramFiles && join(process.env.ProgramFiles, "Steam"),
    ].filter(Boolean);
  }
  return [
    join(homedir(), ".steam/steam"),
    join(homedir(), ".local/share/Steam"),
    join(homedir(), ".var/app/com.valvesoftware.Steam/data/Steam"),
  ];
}

function mostRecentSteamAccount(text) {
  let lastAccount = null;
  let firstAccount = null;
  let mostRecent = null;
  let timestampAccount = null;
  let bestTimestamp = -1;

  for (const line of text.split(/\r?\n/)) {
    const account = line.match(/"AccountName"\s+"([^"]+)"/);
    if (account) {
      lastAccount = account[1];
      firstAccount ??= lastAccount;
    }
    if (line.match(/"MostRecent"\s+"1"/) && lastAccount) mostRecent = lastAccount;
    const timestamp = line.match(/"Timestamp"\s+"(\d+)"/);
    if (timestamp && lastAccount && Number(timestamp[1]) >= bestTimestamp) {
      bestTimestamp = Number(timestamp[1]);
      timestampAccount = lastAccount;
    }
  }

  return mostRecent ?? timestampAccount ?? firstAccount;
}
