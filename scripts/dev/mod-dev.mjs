#!/usr/bin/env node

/**
 * Build and watch one repository mod for local Sandustry development.
 *
 * HMR and game-process supervision are intentionally separate phases. This
 * command owns only the selected mod's build/install loop for now.
 */
import { build } from "esbuild";
import { createServer } from "node:http";
import { createConnection } from "node:net";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { gzipSync } from "node:zlib";
import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSandustryBinary, sandustryModsDir } from "./sandustry-paths.mjs";
import { validatePatches } from "../validate-patches.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const MODS_ROOT = join(ROOT, "mods");
const WORKSHOP_REGISTRY = join(ROOT, "workshop-published-ids.json");
const DEFAULT_SAVE_PATH = join(ROOT, ".sandustry-save");
const HMR_RUNTIME_PATH = join(ROOT, "scripts/dev/hmr-runtime.js");
const HMR_RUNTIME = readFileSync(HMR_RUNTIME_PATH, "utf8");
const HMR_PORT = 19147;
const HMR_PATH = "/hot-reload";
const DEBOUNCE_MS = 100;
const POLL_MS = 250;
const devSessionId = `${process.pid}-${Date.now()}`;
let gameLaunchNumber = 0;

const gzipFontPlugin = {
  name: "sandustry-gzip-fonts",
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: /\.font\.json$/ }, ({ path }) => {
      const source = readFileSync(path, "utf8");
      JSON.parse(source);
      const encoded = gzipSync(source).toString("base64");
      return {
        contents: `export default ${JSON.stringify(encoded)};`,
        loader: "js",
        resolveDir: dirname(path),
      };
    });
  },
};

const args = process.argv.slice(2);
const takeover = args.includes("--takeover");
const debug = args.includes("--debug");
const modArgument = valueAfter("--mod");
const once = args.includes("--once");

if (!modArgument) {
  console.error(
    "Usage: node scripts/dev/mod-dev.mjs --mod <mod> [--save <id>] [--takeover] [--once]",
  );
  process.exit(2);
}

const modDirName = resolveModDirectory(modArgument);
const modDir = join(MODS_ROOT, modDirName);
const modSavePath = join(modDir, ".sandustry-save");
const initialSave =
  cleanSave(valueAfter("--save")) ||
  cleanSave(process.env.SANDUSTRY_DEV_SAVE) ||
  readSaveFile(modSavePath) ||
  readSaveFile(DEFAULT_SAVE_PATH);
const manifestPath = join(modDir, "modinfo.json");
const sourcePath = join(modDir, "src", "entry.tsx");
const overlayPath = join(modDir, "src", "overlay.html");
const buildDir = join(modDir, "build");
const packageDir = join(buildDir, "package");
const devEntryPath = join(buildDir, "dev-entry.js");
const reloadConfigPath = join(modDir, "dev-reload.json");
const manifest = readJson(manifestPath);
const modId = requiredString(manifest.id, "modinfo.id");
const entry = requiredString(manifest.entry, "modinfo.entry");
const workerEntry = manifest.workerEntry
  ? requiredString(manifest.workerEntry, "modinfo.workerEntry")
  : null;
const workerSourcePath = workerEntry ? join(modDir, "src", "worker.tsx") : null;

if (entry !== "entry.js") {
  fail(`modinfo.entry must be entry.js, got ${JSON.stringify(entry)}`);
}
if (!existsSync(sourcePath)) fail(`missing ${relative(ROOT, sourcePath)}`);
if (workerSourcePath && !existsSync(workerSourcePath))
  fail(`missing ${relative(ROOT, workerSourcePath)}`);

const installRoot = sandustryModsDir();
const installDir = join(installRoot, modId);
const devOwnerPath = join(installDir, ".sandustry-dev-owner.json");
let building = false;
let buildQueued = false;
let queuedBuildReason = null;
let queuedReloadMode = null;
let buildTimer = null;
let pollTimer = null;
let shuttingDown = false;
let hotReloadServer = null;
const hotReloadClients = new Set();
let gameChild = null;
let gameRestartTimer = null;
let gameRestarting = false;
let gameOwned = false;
let terminalInputHandler = null;
let devOwnsInstallDir = false;
const gameBinary = resolveSandustryBinary();

console.log(`dev mod: ${modId}`);
console.log(`source: ${relative(ROOT, modDir)}`);
console.log(`install: ${installDir}`);
if (initialSave) console.log(`save override: ${initialSave}`);

startHotReloadServer();
prepareDevInstallOwnership();
await buildAndInstall("initial build");
if (once) {
  shutdown();
  process.exit(0);
}

await ensureGame();

startPolling();
startTerminalControls();

console.log(`watching ${relative(ROOT, modDir)} (r to restart game, Ctrl+C to stop)`);

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

function valueAfter(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function resolveModDirectory(argument) {
  const names = readdirSync(MODS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .filter((name) => !existsSync(join(MODS_ROOT, name, ".deprecated")));

  const match =
    names.find((name) => name === argument) ||
    names.find((name) => name === `sandustry-${argument}`);
  if (!match) fail(`unknown MOD='${argument}'. Available mods: ${names.join(", ")}`);
  return match;
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`could not read ${relative(ROOT, path)}: ${error.message}`);
  }
}

function cleanSave(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readSaveFile(path) {
  try {
    return cleanSave(readFileSync(path, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT")
      console.error(`could not read ${relative(ROOT, path)}: ${error.message}`);
    return null;
  }
}

function requiredString(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a non-empty string`);
  return value;
}

function gamePids() {
  if (process.platform === "win32") {
    try {
      const output = execFileSync(
        "tasklist",
        ["/FI", "IMAGENAME eq Sandustry.exe", "/FO", "CSV", "/NH"],
        {
          encoding: "utf8",
          windowsHide: true,
        },
      );
      return output
        .split(/\r?\n/)
        .map((line) => line.match(/"Sandustry\.exe","(\d+)"/i)?.[1])
        .filter(Boolean)
        .map(Number);
    } catch {
      return [];
    }
  }

  try {
    const output = execFileSync("ps", ["-axo", "pid=,comm="], { encoding: "utf8" });
    const binaryName = process.platform === "darwin" ? "sandustry" : "sandustry";
    return output
      .split(/\r?\n/)
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (!match || !match[2].toLowerCase().endsWith(binaryName)) return null;
        return Number(match[1]);
      })
      .filter((pid) => Number.isInteger(pid));
  } catch {
    return [];
  }
}

async function ensureGame() {
  const existing = gamePids();
  if (existing.length > 0) {
    if (!takeover) {
      console.warn("Sandustry is already running and is not owned by this dev session.");
      console.warn("Use TAKEOVER=1 to let make dev restart and manage it.");
      return;
    }
    await stopGame(existing);
  }
  await launchGame();
}

async function launchGame() {
  if (!existsSync(gameBinary)) {
    console.error(`Sandustry binary not found: ${gameBinary}`);
    console.error("Set SANDUSTRY to the executable path, or start Sandustry manually.");
    return;
  }

  gameLaunchNumber += 1;
  await refreshDevLaunchConfig();

  const gameArgs = ["--no-sandbox"];
  if (debug) gameArgs.push("--inspect=9230", "--remote-debugging-port=9222");
  const launchedChild = spawn(gameBinary, gameArgs, {
    cwd: dirname(gameBinary),
    detached: false,
    env: process.env,
    stdio: "ignore",
  });
  gameChild = launchedChild;
  gameOwned = true;
  launchedChild.on("error", (error) => {
    if (gameChild !== launchedChild) return;
    console.error(`Sandustry failed to launch: ${error.message}`);
    gameChild = null;
    gameOwned = false;
  });
  launchedChild.on("exit", (code, signal) => {
    if (gameChild !== launchedChild) return;
    console.log(`Sandustry exited (${signal ?? code ?? "unknown"})`);
    gameChild = null;
    gameOwned = false;
  });
  if (debug) {
    const ready = await Promise.all([waitForPort(9222), waitForPort(9230)]);
    if (ready.every(Boolean)) console.log("Sandustry debug ports ready");
    else console.warn("Sandustry launched, but one or more debug ports did not open");
  }
  console.log(`Launched Sandustry (pid ${launchedChild.pid ?? "?"})`);
}

async function refreshDevLaunchConfig() {
  if (!initialSave || !existsSync(devEntryPath)) return;

  const entrySource = readFileSync(devEntryPath, "utf8");
  const newline = entrySource.indexOf("\n");
  if (newline < 0) return;

  const configPrefix = "globalThis.__sandustryDevHmrConfig__ = ";
  const firstLine = entrySource.slice(0, newline);
  if (!firstLine.startsWith(configPrefix) || !firstLine.endsWith(";")) return;

  const config = JSON.parse(firstLine.slice(configPrefix.length, -1));
  config.devSessionId = `${devSessionId}-${gameLaunchNumber}`;
  writeFileSync(
    devEntryPath,
    `${configPrefix}${JSON.stringify(config)};${entrySource.slice(newline)}`,
  );
  await installPackage();
}

function waitForPort(port, timeoutMs = 60000) {
  return new Promise((resolveReady) => {
    const deadline = Date.now() + timeoutMs;
    const probe = () => {
      const socket = createConnection({ host: "127.0.0.1", port });
      let settled = false;
      const finish = (ready) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (ready || Date.now() >= deadline) resolveReady(ready);
        else setTimeout(probe, 100);
      };
      socket.once("connect", () => finish(true));
      socket.once("error", () => finish(false));
      socket.setTimeout(500, () => finish(false));
    };
    probe();
  });
}

async function stopGame(pids = gamePids()) {
  if (pids.length === 0) return;
  console.log(`Stopping Sandustry (${pids.join(", ")})...`);
  if (process.platform === "win32") {
    try {
      execFileSync("taskkill", ["/T", "/PID", String(pids[0])], {
        stdio: "ignore",
        windowsHide: true,
      });
    } catch {
      // The process may already be exiting.
    }
  } else {
    for (const pid of pids) {
      try {
        process.kill(pid, "SIGTERM");
      } catch {
        // The process may already be exiting.
      }
    }
  }

  const deadline = Date.now() + 2000;
  while (Date.now() < deadline && gamePids().length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  const remaining = gamePids();
  if (remaining.length === 0) return;
  for (const pid of remaining) {
    try {
      process.kill(pid, "SIGKILL");
    } catch {
      // The process may already be gone.
    }
  }
}

function scheduleGameRestart(reason) {
  if (gameRestartTimer) clearTimeout(gameRestartTimer);
  gameRestartTimer = setTimeout(() => {
    gameRestartTimer = null;
    void restartGame(reason);
  }, 250);
}

async function restartGame(reason) {
  if (gameRestarting) return;
  if (!gameOwned) {
    console.warn(`Skipping Sandustry restart (${reason}); this dev session does not own the game.`);
    return;
  }
  gameRestarting = true;
  try {
    await stopGame(gameChild?.pid ? [gameChild.pid] : gamePids());
    gameChild = null;
    await launchGame();
  } finally {
    gameRestarting = false;
  }
}

function startTerminalControls() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") return;

  terminalInputHandler = (chunk) => {
    for (const character of chunk.toString("utf8")) {
      if (character === "\u0003") {
        shutdown();
        return;
      }
      if (character === "r" || character === "R") scheduleGameRestart("terminal command");
    }
  };

  try {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", terminalInputHandler);
  } catch (error) {
    terminalInputHandler = null;
    console.warn(`terminal controls unavailable: ${error.message}`);
  }
}

async function buildAndInstall(reason, reloadModeOverride = null) {
  if (shuttingDown) return;
  if (building) {
    buildQueued = true;
    queuedBuildReason = reason;
    queuedReloadMode = reloadModeOverride;
    return;
  }

  building = true;
  const started = Date.now();
  console.log(`building (${reason})...`);
  try {
    const typecheck = spawnSync("npx", ["tsc", "--noEmit"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    if (typecheck.status !== 0)
      throw new Error(`TypeScript check failed with exit code ${typecheck.status ?? "unknown"}`);

    mkdirSync(buildDir, { recursive: true });
    const alias = { "~shared": join(ROOT, "shared") };
    // Keep this resolver setup in sync with mods/labelmaker/tools/build.mjs.
    const browserFsShim = join(modDir, "tools/empty-fs.js");
    if (existsSync(browserFsShim)) alias.fs = browserFsShim;
    await build({
      entryPoints: [sourcePath],
      bundle: true,
      format: "esm",
      platform: "neutral",
      target: "es2022",
      mainFields: ["browser", "module", "main"],
      jsxFactory: "sandkit.react.createElement",
      jsxFragment: "sandkit.react.Fragment",
      alias,
      plugins: [gzipFontPlugin],
      outfile: devEntryPath,
      logLevel: "info",
    });
    if (workerSourcePath && workerEntry) {
      await build({
        entryPoints: [workerSourcePath],
        bundle: true,
        format: "esm",
        platform: "neutral",
        target: "es2022",
        mainFields: ["browser", "module", "main"],
        alias,
        plugins: [gzipFontPlugin],
        outfile: join(buildDir, workerEntry),
        logLevel: "info",
      });
    }

    const entryPath = devEntryPath;
    const bundle = readFileSync(entryPath, "utf8");
    const hmrConfig = {
      modId,
      url: `http://127.0.0.1:${HMR_PORT}${HMR_PATH}`,
      autoContinue: debug && !initialSave,
      initialSave,
      devSessionId: `${devSessionId}-${gameLaunchNumber}`,
    };
    writeFileSync(
      entryPath,
      `globalThis.__sandustryDevHmrConfig__ = ${JSON.stringify(hmrConfig)};\n${HMR_RUNTIME}\n${bundle}`,
    );

    await installPackage();
    notifyHotReload(
      reloadModeOverride,
      reason === "overlay change"
        ? ["overlay.html"]
        : ["entry.js", ...(workerEntry ? [workerEntry] : [])],
    );
    if (reason !== "initial build" && (reloadModeOverride ?? reloadMode()) === "restart")
      scheduleGameRestart("restart-mode change");
    console.log(`built ${modId} in ${Date.now() - started}ms`);
  } catch (error) {
    console.error(`build failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    building = false;
    if (buildQueued) {
      buildQueued = false;
      const nextReason = queuedBuildReason ?? "queued change";
      const nextReloadMode = queuedReloadMode;
      queuedBuildReason = null;
      queuedReloadMode = null;
      scheduleBuild(nextReason, nextReloadMode);
    }
  }
}

function reloadMode() {
  if (!existsSync(reloadConfigPath)) return "restart";
  try {
    const config = JSON.parse(readFileSync(reloadConfigPath, "utf8"));
    return config.mode === "hmr" ? "hmr" : "restart";
  } catch (error) {
    console.error(`invalid ${relative(ROOT, reloadConfigPath)}: ${error.message}`);
    return "restart";
  }
}

async function installPackage() {
  captureInstalledWorkshopId();
  await rm(packageDir, { recursive: true, force: true });
  await mkdir(packageDir, { recursive: true });
  await cp(devEntryPath, join(packageDir, "entry.js"));
  if (workerEntry) await cp(join(buildDir, workerEntry), join(packageDir, workerEntry));
  await cp(manifestPath, join(packageDir, "modinfo.json"));

  const patchesPath = join(modDir, "patches.json");
  const packagedPatchesPath = join(packageDir, "patches.json");
  if (existsSync(patchesPath)) {
    validatePatches(JSON.parse(readFileSync(patchesPath, "utf8")), patchesPath);
    await cp(patchesPath, packagedPatchesPath);
  } else {
    rmSync(packagedPatchesPath, { force: true });
  }

  for (const name of ["assets", "preview.png"]) {
    const source = join(modDir, name);
    if (!existsSync(source)) continue;
    const target = join(packageDir, name);
    if (name === "assets") await rm(target, { recursive: true, force: true });
    await cp(source, target, { recursive: true, force: true });
  }

  // Development-only companion content for the HMR runtime. The screen
  // recorder uses this file as its advanced overlay editor input.
  const overlayPath = join(modDir, "src", "overlay.html");
  if (existsSync(overlayPath)) await cp(overlayPath, join(packageDir, "overlay.html"));

  await mkdir(installDir, { recursive: true });
  await cp(packageDir, installDir, { recursive: true, force: true });
}

function prepareDevInstallOwnership() {
  if (existsSync(devOwnerPath)) {
    try {
      const owner = JSON.parse(readFileSync(devOwnerPath, "utf8"));
      if (owner?.modId === modId && owner?.repoRoot === ROOT) {
        rmSync(installDir, { recursive: true, force: true });
      }
    } catch {
      // An unreadable marker is not enough authority to remove the directory.
    }
  }

  if (existsSync(installDir)) return;
  mkdirSync(installDir, { recursive: true });
  writeFileSync(devOwnerPath, `${JSON.stringify({ modId, repoRoot: ROOT }, null, 2)}\n`);
  devOwnsInstallDir = true;
}

function captureInstalledWorkshopId() {
  const installedWorkshop = join(installDir, "workshop.json");
  if (!existsSync(installedWorkshop)) return;

  const workshop = readJson(installedWorkshop);
  const publishedFileId = workshop.publishedFileId;
  if (publishedFileId == null || String(publishedFileId).trim() === "") return;

  const registry = existsSync(WORKSHOP_REGISTRY) ? readJson(WORKSHOP_REGISTRY) : {};
  const normalizedId = String(publishedFileId);
  const recordedId = registry[modId];
  if (recordedId != null && String(recordedId) !== normalizedId) {
    throw new Error(
      `publishedFileId mismatch for ${modId}: registry has ${recordedId}, installed workshop.json has ${normalizedId}`,
    );
  }
  if (recordedId != null) return;

  registry[modId] = normalizedId;
  writeFileSync(WORKSHOP_REGISTRY, `${JSON.stringify(registry, null, 2)}\n`);
  console.log(
    `recorded ${modId} publishedFileId=${normalizedId} in ${relative(ROOT, WORKSHOP_REGISTRY)}`,
  );
}

function startPolling() {
  let previous = snapshotWatchedFiles();
  pollTimer = setInterval(() => {
    const next = snapshotWatchedFiles();
    if (sameSnapshot(previous, next)) return;
    const changed = changedPaths(previous, next);
    previous = next;
    const overlayOnly = changed.length > 0 && changed.every((path) => path === overlayPath);
    const selectedMode = overlayOnly ? "hmr" : reloadMode();
    console.log(
      `detected change (${selectedMode}): ${changed.map((path) => relative(ROOT, path)).join(", ")}`,
    );
    scheduleBuild(
      overlayOnly ? "overlay change" : "source or package change",
      overlayOnly ? "hmr" : null,
    );
  }, POLL_MS);
}

function changedPaths(previous, next) {
  const paths = new Set([...previous.keys(), ...next.keys()]);
  return [...paths].filter((path) => previous.get(path) !== next.get(path));
}

function snapshotWatchedFiles() {
  const files = new Map();
  for (const root of [join(modDir, "src"), join(modDir, "assets"), join(ROOT, "shared")]) {
    collectFiles(root, files);
  }
  for (const path of [
    manifestPath,
    join(modDir, "patches.json"),
    reloadConfigPath,
    modSavePath,
    DEFAULT_SAVE_PATH,
    join(modDir, "preview.png"),
    join(ROOT, "tsconfig.json"),
    HMR_RUNTIME_PATH,
  ]) {
    addFileSnapshot(path, files);
  }
  return files;
}

function collectFiles(root, files) {
  if (!existsSync(root)) return;
  let entries;
  try {
    entries = readdirSync(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) collectFiles(path, files);
    else addFileSnapshot(path, files);
  }
}

function addFileSnapshot(path, files) {
  try {
    const info = statSync(path);
    if (info.isFile()) files.set(path, `${info.mtimeMs}:${info.size}`);
  } catch {
    // Files may be temporarily absent while an editor replaces them.
  }
}

function sameSnapshot(a, b) {
  if (a.size !== b.size) return false;
  for (const [path, signature] of a) if (b.get(path) !== signature) return false;
  return true;
}

function scheduleBuild(reason, reloadModeOverride = null) {
  if (shuttingDown) return;
  if (buildTimer) clearTimeout(buildTimer);
  buildTimer = setTimeout(() => {
    buildTimer = null;
    void buildAndInstall(reason, reloadModeOverride);
  }, DEBOUNCE_MS);
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  if (buildTimer) clearTimeout(buildTimer);
  if (pollTimer) clearInterval(pollTimer);
  if (gameRestartTimer) clearTimeout(gameRestartTimer);
  if (terminalInputHandler) {
    process.stdin.off("data", terminalInputHandler);
    try {
      process.stdin.setRawMode(false);
    } catch {
      // The terminal may already be closed.
    }
    process.stdin.pause();
    terminalInputHandler = null;
  }
  for (const response of hotReloadClients) response.end();
  hotReloadClients.clear();
  hotReloadServer?.close();
  const ownedGamePid = gameOwned ? gameChild?.pid : null;
  if (ownedGamePid) {
    void stopGame([ownedGamePid]).finally(removeOwnedInstallDir);
  } else {
    removeOwnedInstallDir();
  }
  console.log("dev watcher stopped");
}

function removeOwnedInstallDir() {
  if (!devOwnsInstallDir) return;
  rmSync(installDir, { recursive: true, force: true });
  devOwnsInstallDir = false;
}

function startHotReloadServer() {
  hotReloadServer = createServer((request, response) => {
    if (request.method === "POST" && request.url === `${HMR_PATH}/status`) {
      const chunks = [];
      request.on("data", (chunk) => chunks.push(chunk));
      request.on("end", () => {
        try {
          const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
          if (payload.modId === modId && payload.status === "failed") {
            scheduleGameRestart("HMR evaluation failure");
          }
        } catch {
          // Ignore malformed development status reports.
        }
        response.writeHead(204, { "Access-Control-Allow-Origin": "*" });
        response.end();
      });
      return;
    }

    if (request.url !== HMR_PATH) {
      response.writeHead(404, { "Access-Control-Allow-Origin": "*" });
      response.end("not found");
      return;
    }

    response.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    });
    response.write("\n");
    hotReloadClients.add(response);
    request.on("close", () => hotReloadClients.delete(response));
  });
  hotReloadServer.on("error", (error) => {
    console.error(`hot reload server failed: ${error.message}`);
  });
  hotReloadServer.listen(HMR_PORT, "127.0.0.1", () => {
    console.log(`hot reload notify: http://127.0.0.1:${HMR_PORT}${HMR_PATH}`);
  });
}

function notifyHotReload(modeOverride = null, changed = ["entry.js"]) {
  const chunk = `data: ${JSON.stringify({
    v: 1,
    modId,
    changed,
    mode: modeOverride ?? reloadMode(),
  })}\n\n`;
  for (const response of hotReloadClients) {
    try {
      response.write(chunk);
    } catch {
      hotReloadClients.delete(response);
    }
  }
}

function fail(message) {
  console.error(message);
  process.exit(2);
}
