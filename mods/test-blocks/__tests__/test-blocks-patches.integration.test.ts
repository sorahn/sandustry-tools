import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  buildPatchedDistSources,
  collectTestHostPatches,
} from "../../../packages/sandustry-mod-template/modkit/test/patched-dist.ts";
import { extractedDistDir } from "../../../packages/sandustry-mod-template/modkit/test/paths.ts";

const MODS_ROOT = join(process.cwd(), "artifacts", "sandustry-integration", "mods");
const PATCH_IDS = [
  "thermal-source-consumption",
  "test-blocks-category-order",
  "test-blocks-category-label",
];

test("Test Blocks patches are present with their expected contracts", () => {
  const patches = collectTestHostPatches(MODS_ROOT) as Array<{
    id?: string;
    file?: string;
    expectedMatches?: number;
  }>;
  const selected = patches.filter((patch) => PATCH_IDS.includes(patch.id ?? ""));

  assert.deepEqual(
    selected.map((patch) => patch.id),
    PATCH_IDS,
  );
  assert.ok(selected.every((patch) => patch.file === "js/bundle.js"));
  assert.ok(selected.every((patch) => patch.expectedMatches === 1));
});

test("Test Blocks patches apply exactly once to the extracted game", () => {
  const distDir = extractedDistDir();
  assert.ok(distDir, "Run npm run test:integration:setup first.");

  const rawBundle = readFileSync(join(distDir, "js", "bundle.js"), "utf8");
  const patches = collectTestHostPatches(MODS_ROOT) as Array<{
    id?: string;
    find?: string;
  }>;
  const selected = patches.filter((patch) => PATCH_IDS.includes(patch.id ?? ""));
  for (const patch of selected) {
    assert.equal(
      patch.find ? rawBundle.split(patch.find).length - 1 : 0,
      1,
      `${patch.id} no longer matches the extracted bundle exactly once`,
    );
  }

  const patched = buildPatchedDistSources(distDir, { modsDir: MODS_ROOT, patches: selected });
  const bundle = patched.get("js/bundle.js");
  assert.ok(bundle);
  assert.match(bundle, /__sandustryTestBlocksThermalSource/);
  assert.match(bundle, /"production","blocks","testBlocks","economy"/);
  assert.match(bundle, /"misc","logic","blocks","testBlocks","construction","debug"/);
});
