import { readdirSync, realpathSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(import.meta.dirname, "../..");
const ignoredDirectories = new Set([".git", "build", "node_modules"]);

export function findModTests(modDir) {
  const tests = { unit: [], integration: [] };
  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory() && !ignoredDirectories.has(entry.name)) visit(file);
      else if (entry.isFile() && /\.test\.(?:[cm]?[jt]s|[jt]sx)$/.test(entry.name)) {
        const kind = /\.integration\.test\.[jt]sx?$/.test(entry.name) ? "integration" : "unit";
        tests[kind].push(file);
      }
    }
  }
  visit(modDir);
  tests.unit.sort();
  tests.integration.sort();
  return tests;
}

/**
 * @param {string} modDir
 * @param {{
 *   root?: string,
 *   env?: NodeJS.ProcessEnv,
 *   run?: (command: string, args: string[], options: {
 *     cwd: string, env: NodeJS.ProcessEnv, stdio: "inherit"
 *   }) => { status?: number | null, error?: Error, signal?: NodeJS.Signals | null }
 * }} options
 */
export function runModTests(
  modDir,
  { root = repositoryRoot, env = process.env, run = spawnSync } = {},
) {
  root = realpathSync(root);
  modDir = realpathSync(modDir);
  const mod = basename(modDir);
  if (modDir !== join(root, "mods", mod)) {
    throw new Error(`Mod tests require a repository mods/<name> directory: ${modDir}`);
  }
  const tests = findModTests(modDir);
  const testEnv = { ...env, SANDUSTRY_MOD: mod };
  // SEARCH is useful interactively, but publishing must run the whole suite.
  delete testEnv.SEARCH;

  function execute(label, command, args) {
    console.log(`Running ${mod} ${label} tests`);
    const result = run(command, args, { cwd: root, env: testEnv, stdio: "inherit" });
    if (result.error)
      throw new Error(`Could not run ${mod} ${label} tests: ${result.error.message}`);
    if (result.status !== 0) {
      throw new Error(
        `${mod} ${label} tests failed (${result.signal ?? result.status ?? "no exit status"})`,
      );
    }
  }

  if (tests.unit.length > 0) execute("unit", "bun", ["test", ...tests.unit]);
  if (tests.integration.length > 0) {
    execute("integration", process.execPath, [
      join(root, "scripts/test/sandustry-integration.mjs"),
      "--mod",
      mod,
    ]);
  }
  if (tests.unit.length === 0 && tests.integration.length === 0) {
    console.log(`No automated tests found for ${mod}; build and static checks still apply.`);
  }
  return tests;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) {
    console.error("Usage: node scripts/test/mod-tests.mjs <mod-dir>");
    process.exitCode = 2;
  } else {
    try {
      runModTests(resolve(process.argv[2]));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
