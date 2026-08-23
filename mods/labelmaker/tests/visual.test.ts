import assert from "node:assert/strict";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "bun:test";
import { encodeBlueprint } from "../../../packages/sandustry-blueprint-core/src";
import { renderVisualBlueprint } from "../../../packages/sandustry-blueprint-core/tests/visual/node-renderer";
import { createLabelBlueprint } from "../src/blueprint";

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testRoot, "../../..");
const assetRoot = path.join(repoRoot, "apps/blueprint-site/public");
const outputRoot = path.join(repoRoot, "artifacts/visual/labelmaker");

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const SYMBOLS = String.fromCharCode(
  ...Array.from({ length: 95 }, (_, index) => index + 32),
).replace(/[A-Za-z0-9]/g, "");

const fixtures = [
  ["uppercase", UPPERCASE],
  ["lowercase", LOWERCASE],
  ["symbols", SYMBOLS],
] as const;

describe("labelmaker character groups", () => {
  for (const [name, characters] of fixtures) {
    test(name, async () => {
      await mkdir(outputRoot, { recursive: true });
      const input = encodeBlueprint(createLabelBlueprint(characters));
      const png = await renderVisualBlueprint(input, assetRoot);
      const outputPath = path.join(outputRoot, `${name}-current.png`);
      await writeFile(outputPath, png);
      assert.ok((await stat(outputPath)).size > 0, `empty visual output: ${outputPath}`);
    });
  }
});
