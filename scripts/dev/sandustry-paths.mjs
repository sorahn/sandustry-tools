import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, join } from "node:path";

const IS_WINDOWS = process.platform === "win32";

export function sandustryUserDataDir() {
  if (IS_WINDOWS)
    return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "sandustry");
  if (process.platform === "darwin")
    return join(homedir(), "Library", "Application Support", "sandustry");
  return join(homedir(), ".config", "sandustry");
}

export function sandustryModsDir() {
  return process.env.SANDUSTRY_MODS_DIR?.trim() || join(sandustryUserDataDir(), "mods");
}

function steamRoots() {
  if (process.env.STEAM_ROOT?.trim()) return [process.env.STEAM_ROOT.trim()];
  if (IS_WINDOWS) {
    return [
      process.env["ProgramFiles(x86)"] && join(process.env["ProgramFiles(x86)"], "Steam"),
      process.env.ProgramFiles && join(process.env.ProgramFiles, "Steam"),
    ].filter(Boolean);
  }
  if (process.platform === "darwin") {
    return [join(homedir(), "Library", "Application Support", "Steam")];
  }
  return [
    join(homedir(), ".steam", "steam"),
    join(homedir(), ".steam", "root"),
    join(homedir(), ".local", "share", "Steam"),
    join(homedir(), ".var", "app", "com.valvesoftware.Steam", "data", "Steam"),
  ];
}

function libraryRoots(root) {
  const candidates = [
    join(root, "steamapps", "libraryfolders.vdf"),
    join(root, "config", "libraryfolders.vdf"),
  ];
  const libraries = [];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, "utf8");
    for (const match of text.matchAll(/"path"\s+"([^"]+)"/gi)) {
      libraries.push(match[1].replaceAll("\\\\", "\\"));
    }
  }
  return [root, ...libraries];
}

export function steamLibraryRoots() {
  return [...new Set(steamRoots().flatMap(libraryRoots))];
}

export function sandustryInstallDir() {
  return (
    process.env.SANDUSTRY_INSTALL?.trim() ||
    steamLibraryRoots()
      .map((root) => join(root, "steamapps", "common", "Sandustry"))
      .find((candidate) => existsSync(candidate)) ||
    (process.platform === "darwin"
      ? join(
          homedir(),
          "Library",
          "Application Support",
          "Steam",
          "steamapps",
          "common",
          "Sandustry",
        )
      : join(homedir(), ".steam", "steam", "steamapps", "common", "Sandustry"))
  );
}

export function resolveSandustryBinary() {
  const override = process.env.SANDUSTRY?.trim();
  if (override) return override;
  const install = sandustryInstallDir();
  const candidates = IS_WINDOWS
    ? [join(install, "Sandustry.exe"), join(install, "sandustry.exe")]
    : process.platform === "darwin"
      ? [join(install, "Sandustry.app", "Contents", "MacOS", "Sandustry")]
      : [join(install, "sandustry")];
  return candidates.find((candidate) => existsSync(candidate)) || candidates[0];
}

export function resolveSandustryResources() {
  const override = process.env.SANDUSTRY_RESOURCES?.trim();
  if (override) return override;
  const install = sandustryInstallDir();
  const candidates =
    process.platform === "darwin"
      ? [join(install, "Sandustry.app", "Contents", "Resources"), join(install, "resources")]
      : [join(install, "resources")];
  return candidates.find((candidate) => existsSync(candidate)) || candidates[0];
}

export function resolveSandustryAsar() {
  return join(resolveSandustryResources(), "app.asar");
}

export function sandustryBinaryName(binary) {
  return basename(binary);
}
