import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, test } from "bun:test";
import { catalogVisualBlueprint, renderVisualBlueprintSvg } from "./svg-renderer";
import { parseVisualFixtureFilename } from "./fixture-metadata.mjs";

const visualRoot = path.dirname(fileURLToPath(import.meta.url));
const blueprintRoot = path.join(visualRoot, "blueprints");
const snapshotRoot = path.join(visualRoot, "svg");
// Bun consumes --update for its own snapshot machinery, so use the explicit
// environment flag for this test's baseline replacement mode.
const update = process.env.UPDATE_SVG_SNAPSHOTS === "1";
const fixtures = [
  {
    name: "catalog",
    outputName: "catalog",
    input: catalogVisualBlueprint(),
    renderOptions: {},
  },
  ...(await readdir(blueprintRoot))
    .filter((file) => file.endsWith(".txt"))
    .sort()
    .map(parseVisualFixtureFilename)
    .map(async (fixture) => ({
      name: fixture.id,
      outputName: fixture.outputName,
      input: (await readFile(path.join(blueprintRoot, fixture.filename), "utf8")).trim(),
      renderOptions: fixture.renderOptions,
    })),
];

const resolvedFixtures = await Promise.all(fixtures);
if (update) await mkdir(snapshotRoot, { recursive: true });

describe("blueprint SVG snapshots", () => {
  for (const fixture of resolvedFixtures) {
    test(fixture.name, async () => {
      assert.ok(fixture.input, `SVG fixture is empty: ${fixture.name}`);
      const snapshotPath = path.join(snapshotRoot, `${fixture.outputName}.svg`);
      const actual = `${renderVisualBlueprintSvg(fixture.input, {
        ...fixture.renderOptions,
        showEdgeFade: fixture.name === "edge-fade",
      }).trim()}\n`;
      if (update) {
        await writeFile(snapshotPath, actual);
        return;
      }
      const expected = await readFile(snapshotPath, "utf8");
      assert.equal(
        actual,
        expected,
        `SVG snapshot mismatch: ${fixture.name}.svg (run UPDATE_SVG_SNAPSHOTS=1 bun test packages/sandustry-blueprint-core/tests/visual/svg-snapshots.test.ts)`,
      );
    });
  }
});
