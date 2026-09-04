import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const projects = [
  {
    path: ".",
    command: [
      "bun",
      "test",
      "scripts/test-catalog-invariants.test.ts",
      "scripts/bump-version.test.ts",
    ],
  },
  {
    path: "packages/sandustry-blueprint-core",
    command: ["bun", "test", "src", "tests"],
  },
  {
    path: "packages/sandustry-blueprint-node",
    command: ["node", "-e", "console.log('no tests')"],
  },
  {
    path: "packages/sandustry-save-core",
    command: ["bun", "test", "src", "tests"],
  },
  {
    path: "packages/sandustry-ui",
    command: ["node", "-e", "console.log('no tests')"],
  },
  {
    path: "apps/blueprint-site",
    command: ["bun", "test", "src"],
  },
];

function optionValue(name) {
  const inline = process.argv.find((argument) => argument.startsWith(`--${name}=`));
  if (inline) return inline.slice(name.length + 3);

  const index = process.argv.indexOf(`--${name}`);
  if (index !== -1) return process.argv[index + 1] ?? "";

  return process.env[`TEST_${name.toUpperCase()}`] ?? process.env[`npm_config_${name}`] ?? "";
}

function paths(value) {
  return new Set(
    value
      .split(",")
      .map((path) => path.trim())
      .filter(Boolean),
  );
}

const only = paths(optionValue("only"));
const exclude = paths(optionValue("exclude"));
const selected = projects.filter(
  ({ path }) => (only.size === 0 || only.has(path)) && !exclude.has(path),
);

const requested = new Set([...only, ...exclude]);
const known = new Set(projects.map(({ path }) => path));
const unknown = [...requested].filter((path) => !known.has(path));
if (unknown.length > 0) {
  console.error(`Unknown test project(s): ${unknown.join(", ")}`);
  console.error(`Available projects: ${[...known].join(", ")}`);
  process.exit(1);
}

if (selected.length === 0) {
  console.error("No test projects selected.");
  process.exit(1);
}

for (const project of selected) {
  console.log(`\n==> ${project.path}`);
  const result = spawnSync(project.command[0], project.command.slice(1), {
    cwd: resolve(project.path),
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  if (result.status !== 0) process.exit(result.status ?? 1);
}
