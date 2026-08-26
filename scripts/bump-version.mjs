import { existsSync, readFileSync, writeFileSync } from "node:fs";

const [path, part, changelogPath] = process.argv.slice(2);
const manifest = JSON.parse(readFileSync(path, "utf8"));
const previousVersion = manifest.version;
const version = manifest.version.split(".").map(Number);
const index = { major: 0, minor: 1, patch: 2 }[part];
if (index === undefined || version.length !== 3 || version.some(Number.isNaN)) {
  throw new Error("version must be major.minor.patch");
}
version[index] += 1;
for (let i = index + 1; i < 3; i += 1) version[i] = 0;
manifest.version = version.join(".");
writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);

if (changelogPath && existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, "utf8");
  const heading = new RegExp(`^(##\\s+)v?${escapeRegExp(previousVersion)}(\\s*)$`, "mi");
  if (heading.test(changelog)) {
    writeFileSync(changelogPath, changelog.replace(heading, `$1${manifest.version}$2`));
  } else {
    console.warn(
      `No CHANGELOG.md entry for v${previousVersion}; add one for v${manifest.version} before publishing.`,
    );
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");
}
