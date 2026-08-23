import assert from "node:assert/strict";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "bun:test";
import { encodeBlueprint } from "../../../packages/sandustry-blueprint-core/src";
import { renderVisualBlueprint } from "../../../packages/sandustry-blueprint-core/tests/visual/node-renderer";
import { createLabelBlueprint } from "../src/blueprint";
import { loadFontFixture } from "./font-fixtures";

const PSYBERIUS_SANS_FONT = loadFontFixture("psyberius-sans.font.json");
const PIXOLLETTA_FONT = loadFontFixture("pixolletta.font.json");
const KIWI_SODA_FONT = loadFontFixture("kiwisoda.font.json");
const MINECRAFT_FONT = loadFontFixture("minecraft.font.json");
const DOGICA_PIXEL_FONT = loadFontFixture("dogica-pixel.font.json");
const MACS_MINECRAFT_FONT = loadFontFixture("macs-minecraft.font.json");

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testRoot, "../../..");
const assetRoot = path.join(repoRoot, "apps/blueprint-site/public");
const outputRoot = path.join(repoRoot, "artifacts/visual/labelmaker");

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const CHARACTER_SAMPLES = "Ajy&/[_";
const SYMBOLS = String.fromCharCode(
  ...Array.from({ length: 95 }, (_, index) => index + 32),
).replace(/[A-Za-z0-9]/g, "");

const fixtures = [
  ["uppercase", UPPERCASE],
  ["lowercase", LOWERCASE],
  ["symbols", SYMBOLS],
] as const;

const bundledFonts = [
  ["minecraft", MINECRAFT_FONT],
  ["kiwisoda", KIWI_SODA_FONT],
  ["pixolletta", PIXOLLETTA_FONT],
  ["dogica-pixel", DOGICA_PIXEL_FONT],
] as const;

describe("labelmaker character groups", () => {
  for (const [name, characters] of fixtures) {
    test(name, async () => {
      await mkdir(outputRoot, { recursive: true });
      const input = encodeBlueprint(createLabelBlueprint(characters, PSYBERIUS_SANS_FONT));
      const png = await renderVisualBlueprint(input, assetRoot);
      const outputPath = path.join(outputRoot, `${name}-current.png`);
      await writeFile(outputPath, png);
      assert.ok((await stat(outputPath)).size > 0, `empty visual output: ${outputPath}`);
    });
  }

  test("pixolletta lowercase", async () => {
    await mkdir(outputRoot, { recursive: true });
    const input = encodeBlueprint(createLabelBlueprint(LOWERCASE, PIXOLLETTA_FONT));
    const png = await renderVisualBlueprint(input, assetRoot);
    const outputPath = path.join(outputRoot, "pixolletta-lowercase-current.png");
    await writeFile(outputPath, png);
    assert.ok((await stat(outputPath)).size > 0, `empty visual output: ${outputPath}`);
  });

  test("pixolletta character samples", async () => {
    await mkdir(outputRoot, { recursive: true });
    const input = encodeBlueprint(createLabelBlueprint(CHARACTER_SAMPLES, PIXOLLETTA_FONT));
    const png = await renderVisualBlueprint(input, assetRoot);
    const outputPath = path.join(outputRoot, "pixolletta-character-samples-current.png");
    await writeFile(outputPath, png);
    assert.ok((await stat(outputPath)).size > 0, `empty visual output: ${outputPath}`);
  });

  for (const [fontId, font] of bundledFonts) {
    for (const [name, characters] of fixtures) {
      test(`${fontId} ${name}`, async () => {
        await mkdir(outputRoot, { recursive: true });
        const input = encodeBlueprint(createLabelBlueprint(characters, font));
        const png = await renderVisualBlueprint(input, assetRoot);
        const outputPath = path.join(outputRoot, `${fontId}-${name}-current.png`);
        await writeFile(outputPath, png);
        assert.ok((await stat(outputPath)).size > 0, `empty visual output: ${outputPath}`);
      });
    }
  }

  for (const [name, characters] of fixtures) {
    test(`macs minecraft ${name}`, async () => {
      await mkdir(outputRoot, { recursive: true });
      const input = encodeBlueprint(createLabelBlueprint(characters, MACS_MINECRAFT_FONT));
      const png = await renderVisualBlueprint(input, assetRoot);
      const outputPath = path.join(outputRoot, `macs-minecraft-${name}-current.png`);
      await writeFile(outputPath, png);
      assert.ok((await stat(outputPath)).size > 0, `empty visual output: ${outputPath}`);
    });
  }

  test("macs minecraft character samples", async () => {
    await mkdir(outputRoot, { recursive: true });
    const input = encodeBlueprint(createLabelBlueprint(CHARACTER_SAMPLES, MACS_MINECRAFT_FONT));
    const png = await renderVisualBlueprint(input, assetRoot);
    const outputPath = path.join(outputRoot, "macs-minecraft-character-samples-current.png");
    await writeFile(outputPath, png);
    assert.ok((await stat(outputPath)).size > 0, `empty visual output: ${outputPath}`);
  });
});
