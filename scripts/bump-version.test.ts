import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "bun:test";

test("version bump does not rename existing changelog headings", () => {
  const directory = mkdtempSync(join(tmpdir(), "sandustry-bump-version-"));
  const manifestPath = join(directory, "modinfo.json");
  const changelogPath = join(directory, "CHANGELOG.md");
  const changelog =
    "# Mod changelog\n\n## 0.1.3\n\n- New fix.\n\n## 0.1.2\n\n- Previous release.\n";

  try {
    writeFileSync(manifestPath, JSON.stringify({ version: "0.1.2" }));
    writeFileSync(changelogPath, changelog);

    execFileSync(process.execPath, [
      "scripts/bump-version.mjs",
      manifestPath,
      "patch",
      changelogPath,
    ]);

    assert.equal(JSON.parse(readFileSync(manifestPath, "utf8")).version, "0.1.3");
    assert.equal(readFileSync(changelogPath, "utf8"), changelog);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
