import path from "node:path";
import { describe, test } from "bun:test";
import { createLabelBlueprint } from "./blueprint";
import { encodeBlueprint } from "../../../packages/sandustry-blueprint-core/src";
import { renderVisualBlueprint } from "../../../packages/sandustry-blueprint-core/tests/visual/node-renderer";

const repoRoot = path.resolve(import.meta.dir, "../../..");
const assetRoot = path.join(repoRoot, "apps/blueprint-site/public");
const outputRoot = path.join(repoRoot, "artifacts/visual/labelmaker");

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const SYMBOLS = String.fromCharCode(
  ...Array.from({ length: 95 }, (_, index) => index + 32),
).replace(/[A-Za-z0-9]/g, "");

const fixtures = [
  ["labelmaker-uppercase-test", UPPERCASE],
  ["labelmaker-lowercase-test", LOWERCASE],
  ["labelmaker-symbols-test", SYMBOLS],
] as const;

describe("labelmaker character groups", () => {
  for (const [name, characters] of fixtures) {
    test(`renders ${name}`, async () => {
      const input = encodeBlueprint(createLabelBlueprint(characters));
      const png = await renderVisualBlueprint(input, assetRoot);
      await Bun.write(path.join(outputRoot, `${name}.png`), png);
    });
  }
});
